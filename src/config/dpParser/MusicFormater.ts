/* eslint-disable @typescript-eslint/no-explicit-any */
import { TYSdk } from '@ray-js/ray-panel-core';
import { transform, generateStep } from './utils';


export default class MusicFormater {
  uuid: string;
  defaultValue: {
    mode: number; // app音乐
    hue: number; saturation: number; value: number; brightness: number; temperature: number;
  };
  constructor(uuid = 'music_data', defaultValue = null) {
    this.defaultValue = {
      mode: 0, // app音乐
      hue: 0,
      saturation: 0,
      value: 0,
      brightness: 0,
      temperature: 0,
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
  parser(val) {
    const { length } = val;
    if (!length) {
      console.log('数据有问题，无法解析');
      return this.defaultValue;
    }
    const generator = transform(val);
    generator.next();
    // 版本
    const mode = parseInt(generator.next(1).value, 16);
    const hue = parseInt(generator.next(4).value, 16);
    const saturation = parseInt(generator.next(4).value, 16);
    const value = parseInt(generator.next(4).value, 16);
    const brightness = parseInt(generator.next(4).value, 16);
    const temperature = parseInt(generator.next(4).value, 16);
    return {
      mode,
      hue,
      saturation,
      value,
      brightness,
      temperature,
    }
  }
  to16(value, length) {
    let result = Number(value).toString(16);
    if (result.length < length) {
      result = result.padStart(length, '0');
    }
    return result;
  }
  formatter(data) {
    const { mode = 0, hue = 0, saturation = 0, value = 0, brightness = 0, temperature = 0 } = data;
    const modeStr = this.to16(mode, 1);
    const hueStr = this.to16(hue, 4);
    const saturationStr = this.to16(saturation, 4);
    const valueStr = this.to16(value, 4);
    const brightnessStr = this.to16(brightness, 4);
    const temperatureStr = this.to16(temperature, 4);
    return `${modeStr}${hueStr}${saturationStr}${valueStr}${brightnessStr}${temperatureStr}`;
  }
}