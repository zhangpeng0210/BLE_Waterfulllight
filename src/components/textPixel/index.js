import Render from './index.rjs';

Component({
  properties: {
    width: {
      type: Number,
      value: 300, // 画布宽度
    },
    height: {
      type: Number,
      value: 300, // 画布高度
    },
    pixelSize: {
      type: Number,
      value: 20, // 点阵大小
    },
    pixelShape: {
      type: String,
      value: 'circle', // 点阵形状circle, rect
    },
    textColor: {
      type: String,
      value: '#eee', // 默认文字颜色颜色
    },
    gradient: {
      type: Array,
      value: [],
    },
    bgColor: {
      type: String,
      value: '#eee', // 背景颜色
    },
    pixelGap: {
      type: Number,
      value: 0, // 点阵间距
    },
    pixelData: {
      type: Array,
      value: [],
    },
    showType: {
      type: Number,
      value: 0, //展示类型 0，展示 1、输入时候使用
    },
    canvasId: {
      type: String,
      value: 'canvasId',
    },
    animationType: {
      type: String,
      value: 'static',
    },
    interval: {
      type: Number,
      value: 50, //动画间隔50ms-250ms(速度定义的0 - 100)，50 +（200 - 速度 * 2）
    },
    isPause: {
      type: Boolean,
      value: false,
    },
    inputText: {
      type: String,
      value: '',
    },
    isCapture: {
      type: Boolean,
      value: false,
    },
  },
  lifetimes: {
    created: function() {
      this.render = new Render(this);
    },
    ready: function(e) {
      this.isReady = true;
      this.render.initPanel({
        width: this.data.width,
        height: this.data.height,
        pixelSize: this.data.pixelSize,
        pixelShape: this.data.pixelShape,
        textColor: this.data.textColor,
        bgColor: this.data.bgColor,
        gradient: this.data.gradient,
        pixelGap: this.data.pixelGap,
        pixelData: this.data.pixelData,
        showType: this.data.showType,
        canvasId: this.data.canvasId,
        interval: this.data.interval,
        isPause: this.data.isPause,
        inputText: this.data.inputText,
      });
    },
  },
  observers: {
    animationType: function(newValue) {
      this.render.resetPiexl(); //先复位
      this.checkIsNeedStartTimer();
    },
    interval: function(newValue) {
      this.checkIsNeedStartTimer();
    },
    isPause: function(newValue) {
      this.checkIsNeedStartTimer();
    },
    inputText: function(newValue) {
      this.render.drawText({ inputText: newValue });
    },
    bgColor: function(newValue) {
      this.render.drawText({ bgColor: newValue });
    },
    textColor: function(newValue) {
      this.render.drawText({ textColor: newValue });
    },
    gradient: function(newValue) {
      this.render.drawText({ gradient: newValue });
    },
    isCapture: function(newValue) {
      if (newValue) {
        this.render.resetPiexl();
        this.render.endTimer();
        this.render.drawText({ isCapture: newValue });
      }
    },
  },
  methods: {
    catchEvent() {
      this.triggerEvent('touchCanvasEvent');
    },
    //验证是否需要开启动画
    checkIsNeedStartTimer() {
      if (!this.data.isPause) {
        this.render.startTimer(this.data.animationType, this.data.interval);
      } else {
        this.render.endTimer();
      }
    },

    //回调方法，获取缩略图
    getThumbImage(imageData) {
      this.triggerEvent('getThumbImage', imageData);
    },
  },
});
