export default {
  powerCode: 'switch',
  owerCode: 'switch_led',
  colourCode: 'colour_data',
  workModeCode: 'work_mode',
  temperatureCode: 'temp_value',
  brightCode: 'bright_value',
  sceneCode: 'rgbic_linerlight_scene',
  musicCode: 'music_data',
  controlCode: 'control_data',
  rhythmCode: 'rhythm_mode',
  sceneListCode: 'scene_list',
  sceneSelectCode: 'rgbic_linerlight_scene',//scene_select
  sceneCombineCode: 'scene_combine',
  sceneResetCode: 'scene_factory',
  countdownCode: 'countdown',
  timerCode: 'rtc_timer',
  micMusicCode: 'local_music_mode', // 本地麦克风音乐
  switch: 'switch_led',
  switchCode: 'switch_led',
  workMode: 'work_mode',
  DIY: 'diy',//所有DIY相关的协议都通过这个功能点发送
  infraredSwitch:'ir_enable',//红外开关 true、false
  mirrorSwitch:'mirror',//镜像开关 true、false
  sceneBright:'scene_bright',//场景亮度 数值 0-100scene_speed
  sceneSpeed:'scene_speed',//场景亮度 数值 0-100
  sceneDirection:'direction',//场景方向 left right up down flash static
  isPause:'pause',//是否暂停
  lightCount:'led_counts',//灯珠数量
  pid: 'hpid',//基于蓝牙APP的产品id
  isLoop: 'scene_auto_enable',//是否开启场景收藏循环 bool
  loopTimer: 'scene_auto_interval', //收藏循环间隔 单位秒 1-1000
  loopNumbers: 'scene_auto_group_str',//已收藏的场景的序号组成的字符串
  treeStarStatus: 'top_star_ctrl', //static静止 follow跟随 off关闭

  brightLevel:'gain', //亮度增益、等级 
  maxMacAddress:'max_addr', //设置地址码 1-200

};
