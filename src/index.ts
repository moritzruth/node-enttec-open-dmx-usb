import { EventEmitter } from "eventemitter3"
import { SerialPort } from "serialport"

export const VENDOR_ID = "0403" // Enttec
export const PRODUCT_ID = "6001" // Open DMX USB

interface Events {
  ready: []
  error: [Error]
}

type Usleep = (microSeconds: number) => unknown

export class EnttecOpenDMXUSBDevice extends EventEmitter<Events> {
  private shouldBeSending = false
  private sendTimeout: ReturnType<typeof setTimeout> | null = null
  private buffer = Buffer.alloc(513)
  private readonly port: SerialPort
  private readonly usleep: Usleep | null

  /**
   * @param path A path returned by {@link EnttecOpenDMXUSBDevice.listDevices} or
   * {@link EnttecOpenDMXUSBDevice.getFirstAvailableDevice}.
   * @param [startSending=true] Whether the device should start sending as soon as it is ready.
   * @param [usleep=null] A function blocking the event loop for `n` microseconds. See the README.md for more information.
   */
  constructor(path: string, startSending = true, usleep: Usleep | null = null) {
    super()

    this.port = new SerialPort({
      path,
      baudRate: 250000,
      dataBits: 8,
      stopBits: 2,
      parity: "none",
      autoOpen: true
    })

    this.port.on("open", () => {
      this.emit("ready")
      if (startSending) this.startSending(0)
    })

    // Without this, errors would be uncaught.
    this.port.on("error", (error: Error) => {
      this.emit("error", error)
    })

    this.usleep = usleep
  }

  /**
   * Start sending.
   * @param [interval=0] The milliseconds between each attempt to send. Most of the time `0` works fine.
   * @throws When the device is not ready yet.
   */
  startSending(interval = 0) {
    if (!this.port.isOpen) throw new Error("The device is not ready yet. Wait for the 'ready' event.")

    this.shouldBeSending = true

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const send = () => {
      this._sendUniverse()
        .then(() => {
          if (this.shouldBeSending)
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            this.sendTimeout = setTimeout(send, interval)
        })
        .catch(error => this.emit("error", error))
    }

    send()
  }

  /**
   * Stop sending.
   */
  stopSending() {
    this.shouldBeSending = false

    if (this.sendTimeout !== null) clearTimeout(this.sendTimeout)
  }

  /**
   * Set channel values.
   * If channels is an Object, the keys are the channel numbers.
   *
   * @param channels
   * @param [clear=false] Whether all previously assigned channels should be set to `0`
   */
  setChannels(channels: Buffer | number[] | Record<number, number>, clear = false) {
    if (clear) {
      this.buffer = Buffer.alloc(513)
      this.buffer[0] = 0
    }

    if (Buffer.isBuffer(channels)) {
      if (channels.length > 512) throw new Error("The maximum size of an DMX universe is 512 channels.")
      channels.copy(this.buffer, 1)
    } else if (Array.isArray(channels)) {
      if (channels.length > 512) throw new Error("The maximum size of an DMX universe is 512 channels.")

      channels.forEach((value, index) => {
        if (value > 0xFF || value < 0) throw new Error("All values must be between 0 and 255.")
        this.buffer[index + 1] = value
      })
    } else if (typeof channels === "object") {
      Object.entries(channels).forEach(([channel, value]) => {
        let channelNumber

        try {
          channelNumber = Number.parseInt(channel, 10)
        } catch {
          throw new Error("Only channel numbers are supported.")
        }

        if (channelNumber > 512 || channelNumber < 1)
          throw new Error("All channel numbers must be between 1 and 512.")
        else if (value > 0xFF || value < 0)
          throw new Error("All values must be between 0 and 255.")

        this.buffer[channelNumber] = value
      })
    } else throw new TypeError("data must be of type Buffer, Object or Array.")
  }

  /**
   * @returns A Promise resolved when the whole universe was sent.
   * @private
   */
  async _sendUniverse(): Promise<void> {
    return new Promise(resolve => {
      this.port.set({ brk: true, rts: false }, () => {
        if (this.usleep === null) {
          setTimeout(() => {
            this.port.set({ brk: false, rts: false }, () => {
              setTimeout(() => {
                this.port.write(this.buffer, () => resolve())
              }, 1)
            })
          }, 1)
        } else {
          this.usleep(92)

          this.port.set({ brk: false, rts: false }, () => {
            this.usleep!(12)
            this.port.write(this.buffer, () => resolve())
          })
        }
      })
    })
  }

  /**
   * Get the paths of all available devices.
   */
  static async listDevices(): Promise<string[]> {
    const allPorts = await SerialPort.list()
    return allPorts
      .filter(device => device.vendorId === VENDOR_ID && device.productId === PRODUCT_ID)
      .map(device => device.path)
  }

  /**
   * Get the path of the first available device.
   * @throws When no device is found.
   */
  static async getFirstAvailableDevice(): Promise<string> {
    const devices = await EnttecOpenDMXUSBDevice.listDevices()

    if (devices.length === 0) throw new Error("No device found.")
    else return devices[0]
  }
}
