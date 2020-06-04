import { Service, PlatformAccessory, CharacteristicGetCallback } from 'homebridge';

import { Temper1HomebridgePlatform } from './platform';

import * as temper1 from 'temper1';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class Temper1DevicePlatformAccessory {
  private service: Service;
  private device: string;

  constructor(
    private readonly platform: Temper1HomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    if (!accessory.context.device) {
      this.platform.log.error('accessory is missing device context');
    }
    this.device = accessory.context.device;

    this.platform.log.debug('initializing accessory device', this.device);

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'TEMPer1')
      .setCharacteristic(this.platform.Characteristic.Model, 'V1.1')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    // get the TemperatureSensor service if it exists, otherwise create a new TemperatureSensor service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.TemperatureSensor)
      || this.accessory.addService(this.platform.Service.TemperatureSensor);

    // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
    // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
    // this.accessory.getService('NAME') ?? this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE');

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, 'Temper1');

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the CurrentTemperature Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .on('get', this.handleCurrentTemperatureGet.bind(this));

    // update the state of a Characteristic asynchronously instead
    // of using the `on('get')` handlers.
    //
    // Here we change update the CurrentTemperature using the `updateCharacteristic` method.
    setInterval(() => {

      this.handleCurrentTemperatureGet((err, val) => {
        // push the new value to HomeKit
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, <number>val);

        this.platform.log.debug('Pushed updated current CurrentTemperature state to HomeKit:', val);
      });
    }, 20000);
  }

  handleCurrentTemperatureGet(callback: CharacteristicGetCallback) {

    if (!this.device) {
      this.platform.log.error('device is missing');
      return;
    }

    this.platform.log.debug('handleCurrentTemperatureGet for device', this.device);

    temper1.readTemperature(this.device, callback);

  }

}
