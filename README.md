# Homebridge RFXCom Devices

![Release : 2.0 ](https://img.shields.io/github/package-json/v/dimer47/homebridge-rfxcom-devices?color=red&style=flat-square) ![Last update](https://img.shields.io/github/last-commit/dimer47/homebridge-rfxcom-devices?color=yellow&label=Last%20update&style=flat-square) ![Dependency size](https://img.shields.io/bundlephobia/minzip/homebridge-rfxcom-devices?color=green&label=dependency%20size&style=flat-square) ![Repo size](https://img.shields.io/github/repo-size/dimer47/homebridge-rfxcom-devices?style=flat-square) ![Downloads](https://img.shields.io/npm/dt/homebridge-rfxcom-devices?style=flat-square) ![License](https://img.shields.io/github/license/dimer47/homebridge-rfxcom-devices?style=flat-square) 

This Homebridge platform plugin allowing 433mhz RF device support to Homekit.
You need RF Gateway, personaly I used RFXtrx433XL (http://www.rfxcom.com/RFXtrx433XL).

## 🔌 Supported devices

At is moment, this plugin only works with **Chacon Dio devices** like : 
* DoorBell Kit CH84201
* Micro Module DIO Transmitter CH54700

Currently, you can control any devices listed behind has Homekit Programmable Stateless buttons.

## 💻 Development
If your are a developer and you want contribute for increase rf devices integration, join to me !
Clone the repo and send me pull requests.

## 🛠 Configure your plugin

This is a simple plugin configuration, you need to register your plugin in homebridge platforms.

```json
{
    "name": "Homebridge RFXCom Dio Button",
    "serialport": "/dev/tty.usbserial-A129KNRC",
    "platform": "HomebridgeRFXComDioButton",
    "devices": [
        {
            "uniqueid": "0x0235A99E",
            "rfid": "0x0235A99E",
            "type": "button",
            "name": "Bouton murale chambre/couloir",
            "manufacturer": "CHACON DiO",
            "model": "54700",
            "firmwarerevision": "0.1",
            "serialnumber": "0003",
            "entriesid": "unitCode",
            "entries": {
                "1": {
                    "name": "command",
                    "buttons": [
                        "On",
                        "Off"
                    ]
                },
                "2": {
                    "name": "command",
                    "buttons": [
                        "On",
                        "Off"
                    ]
                }
            }
        },
        {
            "uniqueid": "0x01CC19BE",
            "rfid": "0x01CC19BE",
            "type": "button",
            "name": "Bouton murale sonette",
            "manufacturer": "CHACON DiO",
            "model": "CH84201",
            "firmwarerevision": "0.1",
            "serialnumber": "0004",
            "entriesid": "unitCode",
            "entries": {
                "1": {
                    "name": "command",
                    "buttons": [
                        "Group On"
                    ]
                }
            }
        }
    ]
}
