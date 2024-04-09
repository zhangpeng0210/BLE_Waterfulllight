/* eslint-disable @typescript-eslint/no-explicit-any */
declare const _default: {
  /**
   * 解析协议
   */
  parse: (value: string, dpMap: DpMap) => any;
  format: (data: any, dpMap: DpMap) => string;
  onLog: (cb: LogFunc) => void;
  offLog: (cb: LogFunc) => void;
};
export default _default;

/**
 * 解析方法
 * @param {number} value 转成的10进制数
 * @param {string} 截取得到的原字符串值
 */
interface ParseItemFun {
  (value: number, origin?: string): any;
}

/**
 * 反解析方法
 */
interface FormatItemFun {
  (value: any): string;
}

/**
 * 判断类型
 */
export interface Condition {
  /**
   * 待判断的属性
   * 可支持多层级属性，多层级属性请使用数据形式
   */
  prop: string | string[];

  /**
   * 待判断属性相关的值
   */
  value: any;

  /**
   * 指定从当一层层级开始查找属性
   * 若不指定优先从已解析根节点查找，若找不到，到从所属配置的当前节点查找
   */
  findType?: 'root' | 'current';

  /**
   * 执行的判断操作
   * 默认为 eq
   */
  operation?: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte';
}

/**
 * 复合判断
 */
export interface CompositeCondition {
  /**
   * 复合判断的类型
   */
  type: 'or' | 'and';
  /**
   * 判断条件
   */
  conditions: Array<Condition | CompositeCondition>;
}

export interface DpMapItem {
  /**
   * 解析后对应的属性名称
   */
  name: string;
  /**
   * 解析属性时需要满足的条件
   * 不配置表示必须解析
   */
  condition?: Condition | CompositeCondition;
  /**
   * 属性的类型
   * 默认为 number
   * number 十进制数据
   * string 截取后返回字符的值
   * enum 枚举值
   * boolean 布尔值
   * week 返回周数据 为一个 7个长度的包含0和1的数组
   * bit 返回位数据
   * numberBySeparate 数据按字节解析，如：大端格式下，从右开始解，第一个字节为十位个位数，第二个字节为百分位及千分位，以此类推
   * child 子节点数据
   *
   */
  type?:
  | 'number'
  | 'string'
  | 'enum'
  | 'boolean'
  | 'week'
  | 'bit'
  | 'child'
  | 'numberBySeparate'
  | 'custom';

  /**
   * 占的字节数
   * 属性在协议中所占字节数；当type = child时，此配置无效
   * 可支持取当前节点下的属性或下级属性
   * 默认为1
   */
  bytes?: number | string | string[];

  /**
   * 字段解析失败时返回的默认值， 不同类型返回不同的默认值
   * number 十进制数据， 如果 extension 存在 min，则返回 min, 否则返回 0
   * string 截取后返回字符的值，返回一个 bytes 的2倍长的 '0'字符串,
   * enum 枚举值，如果配置的范围，返回范围的第一个数，否则返回 0
   * boolean 布尔值， 返回 false
   * week 周数据， 返回 7 个长度的包含 0 的数组
   * bit 返回位数据 返回 bytes * 8 长度的包含 0 的数组
   * numberBySeparate 数据按字节解析，如果 extension 存在 min，则返回 min, 否则返回 0
   * child 子节点数据 返回 空对象
   */
  defaultValue?: any;

  /**
   * 当type = child 时，需要指定子节点的解析
   */
  childMap?: DpMap;

  /**
   * 表示是否循环解析
   * 默认为否
   */
  loop?: boolean;
  /**
   * 当属性为循环解析时，可指定其循环的次数
   * 可支持取当前节点下的属性或下级属性
   */
  limit?: string | string[] | number;

  /**
   * bit 的位序从哪一边开始
   * 默认为 right
   */
  bitType?: 'left' | 'right';

  /**
   * 数值情况下走的大端格式还是小端格式
   * 默认大端格式 be
   */
  storageType?: 'le' | 'be';

  /**
   * 数值情况下的解析方式
   * 即在协议中这个数据是一个16进制数还是一个10进制数
   * hex 16进制
   * dec 10进制
   * 默认 hex
   */
  numType?: 'hex' | 'dec';

  /**
   * 扩展属性
   * 用于对数据有校性处理
   */
  extension?: {
    /**
     * 当属性类型 type = number 时，定义支持的最小值
     */
    min?: number;
    /**
     * 当属性类型 type = number 时，定义支持的最大值
     */
    max?: number;
    /**
     * 当属性类型 type = enum 时，定义支持的枚举值
     */
    range?: Array<number>;
  };
  /**
   * 当type = custom 时，需要指定的解析方法
   */
  parse?: ParseItemFun;
  /**
   * 当type = custom 时，需要指定的反解析方法
   */
  format?: FormatItemFun;
}

export interface DpTransform {
  /**
   * 协议解析
   * 返回对应的数据对像
   */
  parse: () => any;
  /**
   * 协议反解析
   * 将数据转为协议数据
   */
  format: () => string;
}

export type DpMap = DpMapItem[];

export interface LogData {
  type: 'info' | 'warning' | 'error';
  message: string;
  data: { [key: string]: any }; // 相关错误数据
}

export interface LogFunc {
  (data: LogData): void;
}
