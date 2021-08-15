import {PlatformAccessory} from 'homebridge';
import {HomebridgePlatform} from './platform';
import EventBus from 'eventing-bus';
import {CustomPlatformAccessory} from './definitions/interfaces';


export class PlatformAccessoryButton {
    private customAccessory: CustomPlatformAccessory;

    /**
     * @param {HomebridgePlatform} platform
     * @param {PlatformAccessory} accessory
     */
    constructor(
        private readonly platform: HomebridgePlatform,
        private readonly accessory: PlatformAccessory,
    ) {
      this.customAccessory = this.accessory as CustomPlatformAccessory;

        this.accessory.getService(this.platform.Service.AccessoryInformation)!
          .setCharacteristic(this.platform.Characteristic.Name, this.customAccessory.context.device.name)
          .setCharacteristic(this.platform.Characteristic.Manufacturer, this.customAccessory.context.device.manufacturer)
          .setCharacteristic(this.platform.Characteristic.Model, this.customAccessory.context.device.model)
          .setCharacteristic(this.platform.Characteristic.SerialNumber, this.customAccessory.context.device.serialnumber)
          .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.customAccessory.context.device.firmwarerevision ?? '0.1');

        const buttons = {};
        for (const key in this.customAccessory.context.device.entries) {
          const id = this.customAccessory.context.device.uniqueid + '-button-' + key;

          buttons[key] = this.accessory.getService(id) ||
                this.accessory.addService(this.platform.Service.StatelessProgrammableSwitch, id, id);

          buttons[key].setCharacteristic(this.platform.Characteristic.Name, this.customAccessory.context.device.name + ' Button ' + key);
          buttons[key].getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
            .setProps({
              validValues: Object.keys(this.customAccessory.context.device.entries[key].buttons).map(x => parseInt(x)),
            });

          // eslint-disable-next-line @typescript-eslint/ban-types
          EventBus.on('rfxcom_detection', (evt: object) => {
            if (evt['id'].toString() === this.customAccessory.context.device.rfid.toString() &&
                    parseInt(key) === parseInt(evt[this.customAccessory.context.device.entriesid])) {
              const action = evt[this.customAccessory.context.device.entries[parseInt(key)].name];
              let button_id = -1;

              this.customAccessory.context.device.entries[parseInt(key)].buttons.forEach((v, k) => {
                if (v === action) {
                  button_id = k;
                }
              });

              if (button_id >= 0) {
                // eslint-disable-next-line max-len
                this.platform.log.info('RFXCom device detected button action on button : ' + this.customAccessory.context.device.name + ' (' + this.customAccessory.context.device.uniqueid + ' -> '+this.customAccessory.context.device.entriesid+':'+button_id+' = '+action+')');
                buttons[key].getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent).setValue(button_id);
              }
            }
          });
        }

        setInterval(() => {
          this.platform.log.debug('Get Characteristic updated');
        }, 5000);
    }

}
