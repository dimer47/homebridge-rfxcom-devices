import {PlatformAccessory} from 'homebridge';
import {HomebridgePlatform} from './platform';
import EventBus from 'eventing-bus';
import _ from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function swap(data) {
  const ret = {};
  for (const key in data) {
    ret[data[key]] = key;
  }
  return ret;
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class PlatformAccessoryButton {
  //private service: Service;

  constructor(
    private readonly platform: HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name)
      .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.serialnumber)
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, accessory.context.device.firmwarerevision);

    const buttons = {};
    for (const key in accessory.context.device.entries) {
      const id = accessory.context.device.uniqueid + '-button-' + key;

      buttons[key] = this.accessory.getService(id) ||
        this.accessory.addService(this.platform.Service.StatelessProgrammableSwitch, id, id);

      buttons[key].setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name + ' Button ' + key);
      buttons[key].getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
        .setProps({
          validValues: Object.keys(accessory.context.device.entries[key].buttons).map(x => parseInt(x)),
        });

      // eslint-disable-next-line @typescript-eslint/ban-types
      EventBus.on('rfxcom_detection', (evt: object) => {
        if (evt['id'] + '' === accessory.context.device.rfid + '' && parseInt(key) === parseInt(evt[accessory.context.device.entriesid])) {
          const action = evt[accessory.context.device.entries[parseInt(key)].name];
          let button_id = null;

          // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
          _.forEach(accessory.context.device.entries[parseInt(key)].buttons, (v, k) => {
            if (v === action) {
              button_id = k;
            }
          });

          if (!_.isNull(button_id)) {
            this.platform.log.info('RFXCom device detected button action on button : ' + evt['id']);
            buttons[key].getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent).setValue(button_id);
          }
        }
      });
    }

    setInterval(() => {
      this.platform.log.debug('Get Characteristic updated');
      //buttons[1].getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent).setValue(0);
    }, 5000);
  }

}
