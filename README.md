# node-enttec-open-dmx-usb 🔌
> A Node.js library for interacting with the
> [Enttec Open DMX USB Interface](https://www.enttec.co.uk/en/product/controls/dmx-usb-interfaces/open-dmx-usb/)

Only tested on Windows, but as it uses `serialport` under the hood, it should also work in
[these environments](https://serialport.io/docs/guide-platform-support#supported-platforms-and-architectures).

## Install
![npm](https://img.shields.io/npm/v/enttec-open-dmx-usb?style=flat-square)

Minimum required Node.js version is `v14.0.0`.

```sh
yarn add enttec-open-dmx-usb
# or
npm install enttec-open-dmx-usb
```

## Usage
[**View documentation on jsdocs.io**](https://www.jsdocs.io/package/enttec-open-dmx-usb#EnttecOpenDMXUSBDevice)

```js
import { EnttecOpenDMXUSBDevice as DMXDevice } from "enttec-open-dmx-usb";

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

## Events
`ready` - `startSending` can be called.

`error` - An error occurred. The error can also originate from SerialPort.
