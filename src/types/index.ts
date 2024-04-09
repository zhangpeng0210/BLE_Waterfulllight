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
