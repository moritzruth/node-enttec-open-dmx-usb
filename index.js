import EventEmitter from "events";
import SerialPort from "serialport";
import _ from "lodash";

export const VENDOR_ID = "0403"; // Enttec
export const PRODUCT_ID = "6001"; // Open DMX USB

export class EnttecOpenDMXUSBDevice extends EventEmitter {
  /**
   * @param {string} path A path returned by {@link EnttecOpenDMXUSBDevice.listDevices} or
   * {@link EnttecOpenDMXUSBDevice.getFirstAvailableDevice}.
   * @param {boolean} [startSending=true] If the device should start sending as soon as it is ready.
   */
  constructor (path, startSending = true) {
    super();

    if (typeof path !== "string") {
      throw new TypeError("path has to be of type string.");
    }

    this._shouldBeSending = false;
    this._sendTimeoutID = null;
    this._buffer = Buffer.alloc(513);

    this.port = new SerialPort(path, {
      baudRate: 250000,
      dataBits: 8,
      stopBits: 2,
      parity: "none",
      autoOpen: true
    });

    this.port.on("open", () => {
      this.emit("ready");
      if (startSending) {
        this.startSending(0);
      }
    });
  }

  /**
   * Starts sending.
   * @param {number} [interval=0] The time between each attempt to send.
   * @throws Error If the device is not ready yet.
   */
  startSending (interval = 0) {
    if (!this.port.isOpen) {
      throw new Error("The device is not ready yet. Wait for the 'ready' event.");
    }

    this.emit("startSending", interval);
    this._shouldBeSending = true;

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const send = async () => {
      await this._sendUniverse();
      if (this._shouldBeSending) {
        this._sendTimeoutID = setTimeout(send, interval);
      }
    };

    send();
  }

  /**
   * Stops sending.
   */
  stopSending () {
    this.emit("stopSending");
    this._shouldBeSending = false;

    if (this._sendTimeoutID !== null) {
      clearTimeout(this._sendTimeoutID);
    }
  }

  /**
   * Sets the channel values.
   * If channels is an Object, the keys are the channel numbers.
   *
   * @param {Buffer|Object|Array} channels
   * @param {boolean} [clear=false] If all previously assigned channels should be set to 0
   */
  setChannels (channels, clear = false) {
    if (clear) {
      this._buffer = Buffer.alloc(513);
      this._buffer[0] = 0;
    }

    if (Buffer.isBuffer(channels)) {
      if (channels.length > 512) {
        throw new Error("The maximum size of an DMX universe is 512 channels.");
      }

      channels.copy(this._buffer, 1);
    } else if (Array.isArray(channels)) {
      if (channels.length > 512) {
        throw new Error("The maximum size of an DMX universe is 512 channels.");
      }

      channels.forEach((value, index) => {
        if (value > 0xFF || value < 0) {
          throw new Error("All values must be between 0 and 255.");
        }

        this._buffer[index + 1] = value;
      });
    } else if (typeof channels === "object") {
      Object.entries(channels).forEach(([channel, value]) => {
        let channelNumber;

        try {
          channelNumber = parseInt(channel);
        } catch {
          throw new Error("Only channel numbers are supported.");
        }

        if (channelNumber > 512 || channelNumber < 1) {
          throw new Error("All channel numbers must be between 1 and 512.");
        } else if (value > 0xFF || value < 0) {
          throw new Error("All values must be between 0 and 255.");
        }

        this._buffer[channelNumber] = value;
      });
    } else {
      throw new TypeError("data must be of type Buffer, Object or Array.");
    }
  }

  /**
   * @returns {Promise} Resolves when the whole universe was send.
   * @private
   */
  _sendUniverse () {
    return new Promise(resolve => {
      this.port.set({ brk: true, rts: false }, () => {
        setTimeout(() => {
          this.port.set({ brk: false, rts: false }, () => {
            setTimeout(() => {
              this.port.write(this._buffer, () => resolve());
            }, 0);
          });
        }, 0);
      });
    });
  }

  /**
   * Lists the paths of all available devices.
   * @returns {Promise<string[]>}
   */
  static async listDevices () {
    const allPorts = await SerialPort.list();
    return allPorts
      .filter(x => _.matches({ vendorId: VENDOR_ID, productId: PRODUCT_ID })(x))
      .map(x => _.property("path")(x));
  }

  /**
   * Gets the path of the first available device found.
   * @throws Error when no device is found.
   * @returns {Promise<string>}
   */
  static async getFirstAvailableDevice () {
    const devices = await EnttecOpenDMXUSBDevice.listDevices();

    if (devices.length === 0) {
      throw new Error("No device found.");
    } else {
      return devices[0];
    }
  }
}
