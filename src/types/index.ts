/* eslint-disable no-shadow */
/** Home页签 */
export const HomeTab = {
  dimmer: {
    key: "colour",
    name: "tabar_dimmier",
  },
  sceneHome: {
    key: "scene",
    name: "tabar_scene",
  },
  music: {
    key: "music",
    name: "tabar_music",
  },
  other: {
    key: "other",
    name: "tabar_setting",
  },
};

export type TimerData = {
  byte1?: number; //用于记录重复和周几的字节
  byte2?: number; //时
  byte3?: number; //分
  byte4?: number; //bit1定时动作 bit2开启或关闭 bit3保留 bit4有定时任务 bit5-bit7序号 bit7APP不处理
  detailTime?: string; //定时任务的具体日期时间YYYYMMDDHHmm
  AMOrPMStr?: string; //如果不是24小时制，显示上午还是下午
  hour?: number; //小时
  minute?: number; //分钟
  timeStr?: string; //显示的时间
  action?: number; //定时动作 1 开灯 0 关灯
  actionStr?: string; //显示开灯或者关灯
  weekArray?: Array<string>;
  weekStr?: string; //显示的重复的天(以周几计)
  orderNumber?: number; //定时序号
  isEnabled?: boolean; //定时是否开启

}

//设备的属性(命令0x00通过dp点“diy”获取)
export type DeviceInfoModel = {
  /*设备DIY的类型 
  0、线条分段类型 
  1、线条点控制类型 方向 静态:（左,右,左循环,,右循环,闪烁,固定,呼吸） 动态（呼吸,闪烁) 
  2、不支持DIY 
  3、面型矩阵DIY 方向 静态:（上,下,上循环,下循环，左,右,左循环,,右循环,闪烁,固定,呼吸） 动态（呼吸,闪烁)
  4、异型DIY（如仿真圣诞树、地插灯）
  5、新型线型DIY(如新型瀑布灯-一个灯珠带表一整条灯)
  */
  diyType?: number; 
  //收藏弹窗里边的场景总数量
  sceneAmount?: number;
  //灯总数
  lightAmount?: number;
  //单条灯数
  singleNum?: number;
  //条数、列数 = 总灯数 / 单灯数
  columnNum?: number;
}

//diy的数据
export type DiyData = {
  listId?: string;
  showType?: number;//显示类型 1单图 2多图 3预设场景
  speed?: number; //速度 1- 100
  brightness?: number; //亮度 1- 100
  
}
