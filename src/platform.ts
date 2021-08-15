import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
} from 'homebridge';

import {PLATFORM_NAME, PLUGIN_NAME} from './settings';
import {PlatformAccessoryButton} from './platformAccessoryButton';
import RFXCom from 'rfxcom';
import EventBus from 'eventing-bus';
import {CustomPlatformConfig, Device} from './definitions/interfaces';

export class HomebridgePlatform implements DynamicPlatformPlugin {
    public rfxCom: typeof RFXCom;
    public readonly Service: typeof Service = this.api.hap.Service;
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
    public readonly accessories: PlatformAccessory[] = [];
    public customConfig: CustomPlatformConfig;

    /**
     *
     * @param {Logger} log
     * @param {PlatformConfig} config
     * @param {API} api
     */
    constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) {
      this.customConfig = this.config as CustomPlatformConfig;
      this.log.debug('Finished initializing platform:', this.customConfig.name);

      this.api.on('didFinishLaunching', () => {
        this.discoverDevices();
      });

      this.initRfxCom();
      (async () => {
        await this.listenRfxCom();
      })();
    }

    /**
     *
     * @param {PlatformAccessory} accessory
     */
    configureAccessory(accessory: PlatformAccessory) {
      this.log.info('Loading accessory from cache:', accessory.displayName);
      this.accessories.push(accessory);
    }

    initRfxCom() {
      this.log.info('Init RFXCom device to listen.');
      this.rfxCom = new RFXCom.RfxCom(this.customConfig.serialport, {debug: true});
    }

    async listenRfxCom() {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject('timeout');
        }, 12000);

        try {
          const light = (type: string, evt: unknown) => {
            this.log.info('RFXCom device receive data :', evt);
            EventBus.publish('rfxcom_detection', evt);
          };

          this.rfxCom.on('lighting1', (evt) => light('lighting1', evt));
          this.rfxCom.on('lighting2', (evt) => light('lighting2', evt));
          this.rfxCom.on('lighting3', (evt) => light('lighting3', evt));
          this.rfxCom.on('lighting4', (evt) => light('lighting4', evt));
          this.rfxCom.on('lighting5', (evt) => light('lighting5', evt));
          this.rfxCom.on('lighting6', (evt) => light('lighting6', evt));

          EventBus.on('rfxcom_enable', () => {
            this.log.info('RFXCom enable.');
          });

          this.rfxCom.initialise(() => {
            this.log.info('RFXCom device initialised.');
            EventBus.publish('rfxcom_enable');

            clearTimeout(timeout);
            resolve();
          });
        } catch (e) {
          clearTimeout(timeout);
          reject(e);
        }
      });
    }


    discoverDevices() {
      if (this.customConfig.devices === undefined || this.customConfig.devices === null) {
        return;
      }

      const devices = this.customConfig.devices.map((device) => {
        device.UUID = this.api.hap.uuid.generate(device.uniqueid);
        return device;
      });
      const accessoriesActuallyConfigured = this.accessories.map(accessory => accessory.UUID);
      const toAdd = devices.filter(accessory => accessoriesActuallyConfigured.indexOf(accessory.UUID) < 0);
      const toUpdate = devices.filter(accessory => accessoriesActuallyConfigured.indexOf(accessory.UUID) >= 0);
      const toDelete = accessoriesActuallyConfigured.filter(uuidConfigured => {
        return devices.map(accessory => accessory.UUID).indexOf(uuidConfigured) < 0;
      });


      for (const device of toAdd) {
        const accessory = new this.api.platformAccessory(device.name, device.UUID);
        accessory.context.device = device;

        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        this.instanceAccessory(device, accessory);

        this.log.info('Adding new accessory:', device.name);
      }

      for (const device of toUpdate) {
        const existingAccessory = this.accessories.find(accessory => accessory.UUID === device.UUID);

        if (existingAccessory) {
          this.api.updatePlatformAccessories([existingAccessory]);
          this.instanceAccessory(device, existingAccessory);

          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
        }
      }

      for (const deviceUUID of toDelete) {
        const existingAccessory = this.accessories.find(accessory => accessory.UUID === deviceUUID);

        if (existingAccessory) {
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
          this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        }
      }
    }

    /**
     * @param {Device} device
     * @param {PlatformAccessory} accessory
     * @private
     */
    private instanceAccessory(device: Device, accessory: PlatformAccessory) {
      switch (device.type) {
        case 'button':
          new PlatformAccessoryButton(this, accessory);
          break;
      }
    }
}
