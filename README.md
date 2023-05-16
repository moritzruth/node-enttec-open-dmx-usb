# node-enttec-open-dmx-usb 🔌
> A Node.js library for interacting with the
> [Enttec Open DMX USB interface](https://www.enttec.co.uk/en/product/controls/dmx-usb-interfaces/open-dmx-usb/)

As it uses `serialport` under the hood, it should also work in
[these environments](https://serialport.io/docs/guide-platform-support#supported-platforms-and-architectures).

## Install
![npm](https://img.shields.io/npm/v/enttec-open-dmx-usb?style=flat-square)

The minimum required Node.js version is `v18.0.0`.

```sh
yarn add enttec-open-dmx-usb
# or
npm install enttec-open-dmx-usb
```

## Usage
[**View documentation on jsdocs.io**](https://www.jsdocs.io/package/enttec-open-dmx-usb#EnttecOpenDMXUSBDevice)

```js
import { EnttecOpenDMXUSBDevice as DMXDevice } from "enttec-open-dmx-usb"

(async () => {
  const device = new DMXDevice(await DMXDevice.getFirstAvailableDevice())

  device.setChannels({
    1: 0xFF,
    2: 0x44
  })

  // same as
  device.setChannels([0xFF, 0x44])

  // same as
  device.setChannels(Buffer.from([0xFF, 0x44]))
})()
```

### What to do when this doesn’t work

TLDR: Because `setTimeout` is imprecise, install [`easy-sleep`](https://github.com/qufei1993/easy-sleep) and
pass the `usleep` function provided by it as the third parameter to the constructor of `EnttecOpenDMXUSBDevice`.
See the example below.

From [the Node.js documentation](https://nodejs.org/api/timers.html#settimeoutcallback-delay-args) regarding `setTimeout`:
> Node.js makes no guarantees about the exact timing of when callbacks will fire, nor of their ordering.
> The callback will be called as close as possible to the time specified.

Because of this and the passive nature of the Enttec Open DMX USB interface, sometimes the timing requirements of the DMX specification are not met.
Using a library such as [`easy-sleep`](https://github.com/qufei1993/easy-sleep) which allows sleeping (i. e. blocking the event loop) for a precise
amount of microseconds is a possible workaround.

You may pass a function sleeping for `n` *micro*seconds as the third parameter to the constructor of `EnttecOpenDMXUSBDevice`.

For example, using `easy-sleep`:
```js
import { EnttecOpenDMXUSBDevice as DMXDevice } from "enttec-open-dmx-usb"
import easySleep from "easy-sleep"

new DMXDevice(await DMXDevice.getFirstAvailableDevice(), true, easySleep.Thread.usleep)
```

## Events
`ready` - `startSending` may be called.

`error` - An error occurred. `error` events from `serialport` are passed through.
