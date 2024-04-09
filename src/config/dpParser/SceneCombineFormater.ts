import _ from 'lodash';
import base64 from 'base64-js';
import { transform } from './utils';

const defaultSceneCombineValue = {
  version: 0,
  id: 30,
  loopType: 0,
  list: [12, 15],
};

export default class SceneCombineFormater {
  defaultValue: { version: number; id: number; loopType: number; list: number[]; };
  uuid: string;
  constructor(uuid = 'scene_combine', defaultValue = null) {
    this.defaultValue = defaultSceneCombineValue;
    this.uuid = uuid;
    if (defaultValue) {
      this.defaultValue = defaultValue;
    }
  }
  equal(source, target) {
    return source === target;
  }
  base64ToRaw(value: string) {
    // FIXME: 移除base64ToRaw
    // 协议字符串长度42
    if (value.length !== 42 && value.slice(0, 2) === '00') {
      return value;
    }

    const bytes = base64.toByteArray(value);
    return Array.prototype.map
      .call(bytes, (x: number) => {
        return _.padStart(x.toString(16), 2, '0');
      })
      .join('');
  }
  parser(val = '') {
    const { length } = val;
    if (!length || length % 2 !== 0) {
      console.log('数据有问题，无法解析: ', val, length);
      return this.defaultValue;
    }

    const value = val;
    const generator = transform(value);
    generator.next();
    const version = parseInt(`${generator.next(2).value}`, 16);
    const id = parseInt(`${generator.next(2).value}`, 16);
    const loopType = parseInt(`${generator.next(2).value}`, 16);
    const list = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = generator.next(2);
      list.push(parseInt(`${value}`, 16));
      if (done) {
        break;
      }
    }
    return {
      version,
      id,
      loopType,
      list,
    };
  }

  to16(value, length = 2) {
    let result = Number(value).toString(16);
    if (result.length < length) {
      result = result.padStart(length, '0');
    }
    return result;
  }

  formatter(data) {
    const { version, id, loopType, list } = data;
    const str = `${this.to16(version, 2)}${this.to16(id, 2)}${this.to16(
      loopType,
      2
    )}${list.map(id => this.to16(id)).join('')}`;
    return str;
  }
}
