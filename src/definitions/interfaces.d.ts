import {PlatformAccessory, PlatformConfig} from 'homebridge';

interface CustomPlatformConfig extends PlatformConfig{
    serialport: string;
    devices: Device[];
}
interface DeviceEntries {
    name: string;
    buttons: string[];
}

interface Device {
    UUID: string; // Not present in config file
    uniqueid: string;
    rfid: string;
    type: string;
    name: string;
    manufacturer: string;
    model: string;
    serialnumber: string;
    firmwarerevision: string;
    entriesid: string;
    entries: DeviceEntries[];
}

interface CustomPlatformAccessory extends PlatformAccessory {
    device: Device;
}