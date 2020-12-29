# node-enttec-open-dmx-usb
> A Node.js library for interacting with the
> [Enttec Open DMX USB Interface](https://www.enttec.co.uk/en/product/controls/dmx-usb-interfaces/open-dmx-usb/)

## Installation
```shell script
yarn add enttec-open-dmx-usb
# or
npm install enttec-open-dmx-usb
```

## Usage
[**View documentation on jsdocs.io**](https://www.jsdocs.io/package/enttec-open-dmx-usb#EnttecOpenDMXUSBDevice)

All functions are documented and the code is easy to understand, so feel free to [explore it](src/index.ts).

```js
import { EnttecOpenDMXUSBDevice as DMXDevice } from "enttec-open-dmx-usb";

(async () => {
  const device = new DMXDevice(await DMXDevice.getFirstAvailableDevice());

  device.setChannels({
    1: 0xFF,
    2: 0x44
  });

  // same as
  device.setChannels([0xFF, 0x44]);

  // same as
  device.setChannels(Buffer.from([0xFF, 0x44]));
})();
```
