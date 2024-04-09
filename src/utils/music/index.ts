/* eslint-disable @typescript-eslint/no-unused-vars */
import Complex from './Complex';
import musicUtils from './utils';

export default class {
  // 快速傅里叶变换
  fft(xin, N) {
    const pi = 3.1415927;
    let f,
      m,
      i,
      k,
      j,
      L, // L:运算级数
      p,
      e2,
      le,
      B,
      ip;
    const w = new Complex();
    let t = new Complex();
    const N2 = N / 2; // 每一级中蝶形的个数,同时也代表m位二进制数最高位的十进制权值
    f = N; // f是为了求流程的级数而设立的
    for (m = 1; (f /= 2) > 1; m++); // 得到流程图的共几级
    const nm = N - 2;
    j = N2;
    /** ****倒序运算——雷德算法******/
    for (i = 1; i <= nm; i++) {
      // 防止重复交换
      if (i < j) {
        t = xin[j];
        xin[j] = xin[i];
        xin[i] = t;
      }
      k = N2;
      while (j >= k) {
        j -= k;
        k /= 2;
      }
      j += k;
    }
    /** ****蝶形图计算部分******/
    // 从第1级到第m级
    for (L = 1; L <= m; L++) {
      e2 = Math.pow(2, L);
      le = e2 + 1;
      B = e2 / 2;
      // j从0到2^(L-1)-1
      for (j = 0; j < B; j++) {
        p = (2 * pi) / e2;
        w.real = Math.cos(p * j);
        // w.real=Math.cos((double)p*j);                                   //系数W
        w.image = Math.sin(p * j) * -1;
        // w.imag = -sin(p*j);
        for (
          i = j;
          i < N;
          i += e2 // 计算具有相同系数的数据
        ) {
          ip = i + B; // 对应蝶形的数据间隔为2^(L-1)
          t = xin[ip].cc(w);
          xin[ip] = xin[i].cut(t);
          xin[i] = xin[i].sum(t);
        }
      }
    }
  }

  up2int(iint) {
    let ret = 1;
    while (ret <= iint) {
      ret <<= 1;
    }
    return ret >> 1;
  }

  transform(buffer) {
    const data = buffer;
    const { length } = data;
    const complexs = [];
    const outInt = [];
    try {
      for (let i = 0; i < length; i++) {
        complexs.push(new Complex(data[i]));
      }

      this.fft(complexs, length);

      for (let i = 0; i < length; i++) {
        outInt[i] = complexs[i].getIntValue();
      }
      let musicData = musicUtils.parseMusicData(outInt);
      if (musicData < 0) {
        musicData = 0;
      }

      const color = musicUtils.getColor(musicData);
      return color;
    } catch (e) {
      console.log(e);
    }
  }
}
