/* eslint-disable @typescript-eslint/no-explicit-any */
import { TYSdk } from '@ray-js/ray-panel-core';
import { transform, generateStep } from './utils';


export default class ScenesFormater {
  defaultValue: {
    version: number;
    list: {
      id: number; speed: number; brightness: number; temperature: number; isSupportBright: boolean;
      isSupportSpeed: boolean; isSupportTemperature: boolean; isNormalLoop: boolean; isRandomLoop: boolean;
      name: string;
    }[]
  };
  uuid: string;
  constructor(uuid = 'scene_list', defaultValue = null) {
    this.defaultValue = {
      version: 0,
      list: []
    };
    this.uuid = uuid;
    if (defaultValue) {
      this.defaultValue = defaultValue;
    }
  }
  equal(source, target) {
    return source === target;
  }
  parseUnits(generator) {
    const step2 = generateStep(generator, 2);

    const result: any = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = generator.next(2);
      if (done) {
        break;
      }
      const id = parseInt(value, 16);
      const opt = Array.from(
        step2()
          .toString(2)
          .padStart(8, '0')
      ).map(i => Number(i));

      const isSupportBright = !!opt[7];
      const isSupportTemperature = !!opt[6];
      const isSupportSpeed = !!opt[5];
      const isNormalLoop = (!opt[3] && !!opt[4]) || id === 30; // 顺序循环
      const isRandomLoop = !!opt[3] && !opt[4]; // 随机循环
      // 其他扩展配置
      let brightness = 100;
      brightness = step2();
      let temperature = 100;
      temperature = step2();
      let speed = 1;
      speed = step2();
      result.push({
        id,
        speed,
        brightness,
        temperature,
        isSupportBright,
        isSupportSpeed,
        isSupportTemperature,
        isNormalLoop,
        isRandomLoop,
      });
    }
    // 蓝牙ble设备固定8个情景，设备仅上报7个情景，面板做判断蓝牙ble即能力值为1024的设备增加一个循环情景
    if (`${TYSdk.devInfo.capability}` === '1024' && result.findIndex(d => d.id === 30) === -1) {
      result.push({
        id: 30,
        speed: 1,
        brightness: 100,
        temperature: 100,
        isSupportBright: true,
        isSupportSpeed: false,
        isSupportTemperature: false,
        isNormalLoop: true,
        isRandomLoop: false,
      });
    }
    return result;
  }
  parser(value) {
    const { length } = value;
    if (!length) {
      console.log('数据有问题，无法解析');
      return this.defaultValue;
    }
    const generator = transform(value);
    const generatorList = transform(value.slice(2));
    generator.next();
    generatorList.next();

    // 版本
    const version = parseInt(generator.next(2).value, 16);
    return {
      version,
      list: this.parseUnits(generatorList),
    };
  }
  to16(value, length) {
    let result = Number(value).toString(16);
    if (result.length < length) {
      result = result.padStart(length, '0');
    }
    return result;
  }
  formatter(data) {
    const { version, list } = data;
    const listString = list
      .map(
        ({
          id,
          speed,
          brightness,
          temperature,
          isSupportBright,
          isSupportSpeed,
          isSupportTemperature,
          isNormalLoop,
          isRandomLoop,
        }) => {
          const opts = [
            0,
            0,
            0,
            isRandomLoop ? 1 : 0,
            isNormalLoop ? 1 : 0,
            Number(!!isSupportSpeed),
            Number(!!isSupportTemperature),
            Number(!!isSupportBright),
          ];
          const optNum = parseInt(opts.join(''), 2);
          // return `${this.to16(id, 2)}${this.to16(optNum, 2)}${
          //   isSupportBright ? this.to16(brightness, 2) : ''
          // }${isSupportTemperature ? this.to16(temperature, 2) : ''}${
          //   isSupportSpeed ? this.to16(speed, 2) : ''
          // }`;
          return `${this.to16(id, 2)}${this.to16(optNum, 2)}${this.to16(brightness, 2)}${this.to16(
            temperature,
            2
          )}${this.to16(speed, 2)}`;
        }
      )
      .join('');

    return `${this.to16(version, 2)}${listString}`;
  }
}