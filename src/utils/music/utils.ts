/* eslint-disable @typescript-eslint/no-explicit-any */
class MusicUtils {
  mBrightness: number;
  mPerPosition: number;
  color_1: number[];
  color_2: number[];
  color_3: number[];
  color_4: number[];
  color_5: number[];
  color_6: number[];
  color_7: number[];
  color_8: number[];
  color_9: number[];
  color_10: number[];
  colorParams: any[];
  constructor() {
    this.mBrightness = 0;
    this.mPerPosition = 0;
    this.color_1 = [26, 0, 0, 10, 10];
    this.color_2 = [51, 31, 0, 20, 20];
    this.color_3 = [61, 77, 0, 30, 30];
    this.color_4 = [20, 102, 0, 40, 40];
    this.color_5 = [0, 128, 51, 50, 50];
    this.color_6 = [0, 153, 153, 60, 60];
    this.color_7 = [0, 71, 179, 70, 70];
    this.color_8 = [41, 0, 204, 80, 80];
    this.color_9 = [184, 0, 230, 90, 90];
    this.color_10 = [255, 0, 153, 100, 100];
    this.colorParams = [
      this.color_1,
      this.color_2,
      this.color_3,
      this.color_4,
      this.color_5,
      this.color_6,
      this.color_7,
      this.color_8,
      this.color_9,
      this.color_10,
    ];
  }

  getBrightness(n) {
    if (n < 0) {
      return 0;
    }
    if (n <= 7000) {
      return (n - 5000) / 1000 + 1;
    }
    if (n <= 10000) {
      return (n - 7000) / 700 + 3;
    }
    if (n <= 20000) {
      return (n - 10000) / 1000 + 1;
    }
    if (n <= 30000) {
      return (n - 20000) / 400 + 40;
    }
    if (n <= 40000) {
      return (n - 30000) / 400 + 70;
    }
    if (n <= 48000) {
      return (n - 40000) / 800 + 79;
    }
    return (n - 48000) / 1000 + 90;
  }

  getBrightnessFromAudio(n) {

    if (n < 20000) {
      return 0;
    }

    if (n < 50000) {
      return 0;
    }

    if (n < 80000) {
      return 10;
    }

    if (n < 100000) {
      return 20;
    }

    if (n < 140000) {
      return 30;
    }
    if (n < 200000) {
      return 40;
    }
    if (n < 300000) {
      return 50;
    }
    if (n < 500000) {
      return 60;
    }
    if (n < 700000) {
      return 70;
    }

    if (n < 900000) {
      return 80;
    }

    if (n < 1200000) {
      return 90;
    }

    return 99;
  }

  getColorRandom(mBrightness) {
    if (Math.abs(mBrightness - this.mBrightness) < 50) {
      this.mBrightness = mBrightness;
      return this.colorParams[this.mPerPosition];
    }

    //随机颜色
    this.mPerPosition = Math.floor(Math.random() * 10);
    return this.colorParams[this.mPerPosition];
  }

  getColor(mBrightness) {
    const index = Math.floor(mBrightness / 10);
    return this.colorParams[index];
  }

  parseMusicData(array) {
    let n = 0;
    for (let i = 0; i < array.length; ++i) {
      n += array[i];
    }
    if (n == 0) {
      return -1;
    }
    return this.getBrightnessFromAudio(n);
  }
}

export default new MusicUtils();
