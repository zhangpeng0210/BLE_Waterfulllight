import base64 from 'base64-js';
import _ from 'lodash';
import { transform, generateStep } from './utils';

export default class SceneFormater {
  defaultValue: {
    version: number;
    isSupportBright: boolean;
    isSupportSpeed: boolean;
    isSupportTemperature: boolean;
    isNormalLoop: boolean;
    isRandomLoop: boolean;
    id: number;
    speed: number;
    brightness: number;
    temperature: number;
  };
  uuid: string;
  constructor(uuid = 'scene_data', defaultValue = null) {
    this.defaultValue = {
      version: 0,
      isSupportBright: true,
      isSupportSpeed: false,
      isSupportTemperature: false,
      isNormalLoop: false,
      isRandomLoop: false,
      id: 0,
      speed: 1,
      brightness: 100,
      temperature: 100,
    };
    this.uuid = uuid;
    if (defaultValue) {
      this.defaultValue = defaultValue;
    }
  }
  base64ToRaw(value: string) {
    // FIXME: 移除base64ToRaw
    // 协议字符串长度12
    if (value.length !== 8) {
      return value;
    }

    const bytes = base64.toByteArray(value);
    return Array.prototype.map
      .call(bytes, (x: number) => {
        return _.padStart(x.toString(16), 2, '0');
      })
      .join('');
  }
  equal(source, target) {
    return source === target;
  }
  parser(val) {
    if (typeof val === 'undefined') {
      console.log('数据有问题，无法解析');
      return this.defaultValue;
    }
    const { length } = val;
    if (!length) {
      console.log('数据有问题，无法解析');
      return this.defaultValue;
    }
    const value = val;

    const generator = transform(value);
    const step2 = generateStep(generator, 2);
    generator.next();
    const version = step2();

    const id = step2();
    const opt = Array.from(
      step2()
        .toString(2)
        .padStart(8, '0')
    ).map(i => Number(i));
    const isSupportBright = !!opt[7];
    const isSupportTemperature = !!opt[6];
    const isSupportSpeed = !!opt[5];
    const isNormalLoop = !opt[3] && !!opt[4]; // 顺序循环
    const isRandomLoop = !!opt[3] && !opt[4]; // 随机循环
    let brightness = 100;
    brightness = step2();
    let temperature = 100;
    temperature = step2();
    let speed = 1;
    speed = step2();
    return {
      version,
      id,
      speed,
      brightness,
      temperature,
      isSupportBright,
      isSupportSpeed,
      isSupportTemperature,
      isNormalLoop,
      isRandomLoop,
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
    const {
      version,
      id,
      speed,
      brightness,
      temperature,
      isSupportBright,
      isSupportSpeed,
      isSupportTemperature,
      isNormalLoop,
      isRandomLoop,
    } = data;
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
    return `${this.to16(version, 2)}${this.to16(id, 2)}${this.to16(optNum, 2)}${this.to16(
      brightness,
      2
    )}${this.to16(temperature, 2)}${this.to16(speed, 2)}`;
  }
}
