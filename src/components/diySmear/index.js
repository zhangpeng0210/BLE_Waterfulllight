import Render from './index.rjs';
Component({
  // absoluteScale: 1,
  data: {
    absoluteScale: 1, //缩放比例
    opration: 1, //操作类型 1、画笔 2、油漆桶 3、橡皮擦、4、吸色器 5、拖拽
    isDynamic: false, //是否是动态
    lastColor: '#f00', //选中橡皮擦之前的颜色
  },
  properties: {
    width: {
      type: Number,
      value: 300, // 画布宽度
    },
    height: {
      type: Number,
      value: 300, // 画布高度
    },
    //组件的宽度
    elementWidth: {
      type: String,
      value: '750rpx',
    },
    //组件的高度
    elementHeight: {
      type: String,
      value: '750rpx',
    },
    elementPadding: {
      type: String,
      value: '2rpx',
    },
    pixelSize: {
      type: Number,
      value: 20, // 点阵大小
    },
    pixelShape: {
      type: String,
      value: 'circle', // 点阵形状circle, rect
    },
    pixelColor: {
      type: String,
      value: '#eee', // 默认点阵颜色
    },
    selectedColorHue: {
      type: Number,
      value: 0, //选中的颜色
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
      value: 0, //展示类型 0，仅展示，不允许涂抹 1、可以涂抹
    },
    canvasId: {
      type: String,
      value: 'canvasId',
    },
    animationType: {
      type: String,
      value: 'static', //动画类型
    },
    interval: {
      type: Number,
      value: 100, //动画间隔100ms-600ms(速度定义的0 - 100)，100 +（100 - 速度） * 5
    },
    isPause: {
      type: Boolean,
      value: false,
    },
    dynamicData: {
      type: Array,
      value: [],
    },
    isDynamic: {
      type: Boolean,
      value: false,
    },
    isCurrentSwiperItem: {
      type: Boolean,
      value: false, //
    },
  },
  lifetimes: {
    created: function() {
      this.render = new Render(this);
    },
    ready: function(e) {
      this.isReady = true;

      this.render.initCanvas({
        canvasId: this.data.canvasId,
      });

      this.render.initPanel({
        width: this.data.width,
        height: this.data.height,
        pixelSize: this.data.pixelSize,
        pixelShape: this.data.pixelShape,
        pixelColor: this.data.pixelColor,
        pixelGap: this.data.pixelGap,
        pixelData: this.data.pixelData,
        dynamicData: this.data.dynamicData,
        showType: this.data.showType,
        canvasId: this.data.canvasId,
        absoluteScale: this.data.absoluteScale,
        interval: this.data.interval,
        isPause: this.data.isPause,
        isDynamic: this.data.isDynamic,
      });
    },
  },
  observers: {
    pixelData: function(newVal) {
      if (this.isReady) {
        this.render.initPanel({
          width: this.data.width,
          height: this.data.height,
          pixelSize: this.data.pixelSize,
          pixelShape: this.data.pixelShape,
          pixelColor: this.data.pixelColor,
          pixelGap: this.data.pixelGap,
          pixelData: newVal,
          showType: this.data.showType,
          canvasId: this.data.canvasId,
          absoluteScale: this.data.absoluteScale,
          interval: this.data.interval,
          isPause: this.data.isPause,
          isDynamic: this.data.isDynamic,
        });
        this.render.resetPiexl(); //先复位
      }
    },
    dynamicData: function(newVal) {
      if (this.isReady)
        this.render.initPanel({
          width: this.data.width,
          height: this.data.height,
          pixelSize: this.data.pixelSize,
          pixelShape: this.data.pixelShape,
          pixelColor: this.data.pixelColor,
          pixelGap: this.data.pixelGap,
          dynamicData: newVal,
          showType: this.data.showType,
          canvasId: this.data.canvasId,
          absoluteScale: this.data.absoluteScale,
          interval: this.data.interval,
          isPause: this.data.isPause,
          isDynamic: this.data.isDynamic,
        });

      this.checkIsNeedStartTimer();
    },
    animationType: function(newValue) {
      if (this.isReady) this.render.resetPiexl(); //先复位
      this.checkIsNeedStartTimer();
    },
    interval: function(newValue) {
      this.checkIsNeedStartTimer();
    },
    isPause: function(newValue) {
      this.checkIsNeedStartTimer();
    },
    isCurrentSwiperItem: function(newValue) {
      this.checkIsNeedStartTimer();
    },
    isDynamic: function(newValue) {
      if (this.isReady)
        this.render.initPanel({
          width: this.data.width,
          height: this.data.height,
          pixelSize: this.data.pixelSize,
          pixelShape: this.data.pixelShape,
          pixelColor: this.data.pixelColor,
          pixelGap: this.data.pixelGap,
          pixelData: this.data.pixelData,
          dynamicData: this.data.dynamicData,
          showType: this.data.showType,
          canvasId: this.data.canvasId,
          absoluteScale: this.data.absoluteScale,
          interval: this.data.interval,
          isPause: this.data.isPause,
          isDynamic: this.data.isDynamic,
        });

      this.checkIsNeedStartTimer();
    },
    selectedColorHue: function(hueValue) {
      const rgb = hslToRgb(hueValue, 1, 0.5);
      let rgbStr = '';
      if (hueValue == 510) {
        rgbStr = 'rgb(255,255,255)';
      } else {
        rgbStr = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
      }
      this.render.updateColor(rgbStr);
      this.setData({
        lastColor: rgbStr,
      });

      if (this.data.opration === 2) {
        //油漆桶时候
        let newPixelData = this.data.pixelData.map(pixel => {
          let newPixel = pixel;
          newPixel.fillStyle = rgbStr;
          return newPixel;
        });
        this.setData({ pixelData: newPixelData });
      }
      if (this.data.opration == 3) {
        this.setData({ opration: 1 });
        this.render.updateOpration(1);
        this.triggerEvent('oprationChanged', 1);
      }
    },
  },
  methods: {
    //是否能拖动
    isDragCanvas: function() {
      if (this.data.opration !== 5) {
        this.data.opration = 5;
        this.setData({ opration: 5 });
        this.render.updateOpration(5);
        this.triggerEvent('oprationChanged', 5);
      } else {
        this.data.opration = 1;
        this.setData({ opration: 1 });
        this.render.updateOpration(1);
        this.triggerEvent('oprationChanged', 1);
      }
    },

    // 缩小画布
    shrinkCanvas: function() {
      if (this.data.absoluteScale > 1) {
        this.render.shrink((this.data.absoluteScale - 0.5) / this.data.absoluteScale);
        this.data.absoluteScale -= 0.5;
        this.setData({ absoluteScale: this.data.absoluteScale });
      } else {
        ty.showToast({
          title: i18n.t('diy_edit_toast_2'),
          icon: 'none',
          duration: 1500,
        });
      }
    },
    // 放大画布
    magnifyCanvas: function() {
      if (this.data.absoluteScale < 3) {
        this.render.magnify((this.data.absoluteScale + 0.5) / this.data.absoluteScale);
        this.data.absoluteScale += 0.5;

        this.setData({
          absoluteScale: this.data.absoluteScale,
        });
      } else {
        ty.showToast({
          title: i18n.t('diy_edit_toast_1'),
          image: null,
          icon: 'none',
          duration: 1500,
        });
      }
    },

    //画笔
    drawPen: function() {
      if (this.data.opration !== 1) {
        this.data.opration = 1;
        this.setData({ opration: 1 });
        this.render.updateColor(this.data.lastColor);

        this.render.updateOpration(1);
        this.triggerEvent('oprationChanged', 1);
      }
    },
    //油漆桶
    paintBucket: function() {
      if (this.data.opration !== 2) {
        this.data.opration = 2;
        this.setData({ opration: 2 });
        this.render.updateOpration(2);
        this.triggerEvent('oprationChanged', 2);
      }
    },
    // 橡皮擦
    eraserCanvas: function() {
      if (this.data.opration !== 3) {
        this.data.opration = 3;
        this.setData({ opration: 3 });
        this.render.eraser();
        this.render.updateOpration(3);
        this.triggerEvent('oprationChanged', 3);
      }
    },
    //吸色器
    eyedropper: function(e) {
      if (this.data.opration !== 4) {
        this.data.opration = 4;
        this.setData({ opration: 4 });
        this.render.updateOpration(4);
        this.triggerEvent('oprationChanged', 4);
      }
    },

    // 清除画布
    clearCanvas: function() {
      // console.log(this.checkIsHaveSmear());
      if (this.checkIsHaveSmear()) {
        ty.showModal({
          title: i18n.t('diy_edit_delete_modal_title'),
          content: i18n.t('diy_edit_delete_modal_content'),
          cancelText: i18n.t('cancel'),
          confirmText: i18n.t('confirm'),
          success: res => {
            if (res.confirm) {
              this.render.clear();
              this.triggerEvent('clearCavasEvent');
            }
          },
        });
      }
    },

    //回调方法
    getBoxData(box, idx) {
      this.triggerEvent('smearChanged', { box: box, idx: idx });
      this.data.pixelData = box;
    },

    //吸色器洗到颜色
    eyedropperColor(color) {
      this.triggerEvent('getEyedropperColor', color);
    },

    //回调方法，获取缩略图
    getThumbImage(imageData) {
      this.triggerEvent('getThumbImage', imageData);
    },

    catchEvent() {
      this.triggerEvent('touchCanvasEvent');
    },
    //检查是否有涂抹
    checkIsHaveSmear() {
      if (this.data.isDynamic) {
        return !(this.data.dynamicData === '' || this.data.dynamicData.length === 0);
      }
      if (this.data.pixelData === '') {
        return false;
      }
      return this.data.pixelData.some(piexl => {
        return piexl.fillStyle != this.data.pixelColor;
      });
    },
    //验证是否需要开启动画
    checkIsNeedStartTimer() {
      if (this.isReady)
        if (this.data.isCurrentSwiperItem && !this.data.isPause) {
          this.render.startTimer(this.data.animationType, this.data.interval);
        } else {
          this.render.endTimer();
        }
    },
  },
});

function hslToRgb(h, s, l) {
  // 360, 1.0, 1.0
  const h0 = (((h % 360) + 360) % 360) / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = _hueToRgb(p, q, h0 + 1 / 3);
  const g = _hueToRgb(p, q, h0);
  const b = _hueToRgb(p, q, h0 - 1 / 3);
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function _hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
