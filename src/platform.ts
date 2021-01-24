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

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HomebridgePlatform implements DynamicPlatformPlugin {
  public rfxcom: typeof RFXCom;
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    (async () => {
      this.log.debug('Finished initializing platform:', this.config.name);

      // When this event is fired it means Homebridge has restored all cached accessories from disk.
      // Dynamic Platform plugins should only register new accessories after this event was fired,
      // in order to ensure they weren't added to homebridge already. This event can also be used
      // to start discovery of new accessories.
      this.api.on('didFinishLaunching', () => {
        log.debug('Executed didFinishLaunching callback');
        // run the method to discover / register your devices as accessories
        this.discoverDevices();
      });

      this.initRfxCom();
      await this.listenRfxCom();
    })();
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }


  initRfxCom() {
    this.log.info('Init RFXCom device to listen.');
    this.rfxcom = new RFXCom.RfxCom(this.config.serialport, {debug: true});
  }

  async listenRfxCom() {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject('timeout');
      }, 12000);

      try {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const light = (type: string, evt: object) => {
          this.log.info('RFXCom device receive data :', evt);
          EventBus.publish('rfxcom_detection', evt);
        };

        this.rfxcom.on('lighting1', (evt) => light('lighting1', evt));
        this.rfxcom.on('lighting2', (evt) => light('lighting2', evt));
        this.rfxcom.on('lighting3', (evt) => light('lighting3', evt));
        this.rfxcom.on('lighting4', (evt) => light('lighting4', evt));
        this.rfxcom.on('lighting5', (evt) => light('lighting5', evt));
        this.rfxcom.on('lighting6', (evt) => light('lighting6', evt));

        EventBus.on('rfxcom_enable', () => {
          this.log.info('RFXCom enable.');
        });
        this.rfxcom.initialise(() => {
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

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {

    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud services
    // or a user-defined array in the platform config.

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const devices = this.config.devices;

    // loop over the discovered devices and register each one if it has not already been registered
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    for (const device of devices) {

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device.uniqueid);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory not exists
        if (!device) {
          // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
          // remove platform accessories when no longer present
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
          this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        } else {
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

          // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
          // existingAccessory.context.device = device;
          // this.api.updatePlatformAccessories([existingAccessory]);

          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          switch (device.type) {
            case 'button':
              new PlatformAccessoryButton(this, existingAccessory);
              break;
          }

          // update accessory cache with any changes to the accessory details and information
          this.api.updatePlatformAccessories([existingAccessory]);
        }
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.name);

        // create a new accessory
        const accessory = new this.api.platformAccessory(device.name, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        switch (device.type) {
          case 'button':
            new PlatformAccessoryButton(this, accessory);
            break;
        }

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }
}
