# node-enttec-open-dmx-usb
> A Node.js library for sending DMX data through the
>[Enttec Open DMX USB Interface](https://www.enttec.co.uk/en/product/controls/dmx-usb-interfaces/open-dmx-usb/)

## Installation
```bash
yarn add node-enttec-open-dmx-usb
# or
npm install node-enttec-open-dmx-usb
```

## Usage
All functions are documented using JSDoc and the code is not uglified, so feel free to [explore it](index.js).

```js
import { EnttecOpenDMXUSBDevice as DMXDevice } from "node-enttec-open-dmx-usb";

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
