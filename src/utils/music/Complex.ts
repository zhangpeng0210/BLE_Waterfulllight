/**
 * 复数的加减乘运算
 */
export default class Complex {
  real: number;
  image: number;
  constructor(real = 0, image = 0) {
    if (!real && !image) {
      this.real = 0;
      this.image = 0;
    } else if (!image) {
      this.real = real;
      this.image = 0;
    } else {
      this.real = real;
      this.image = image;
    }
  }

  // 乘法
  cc(complex) {
    const tmpComplex = new Complex();
    tmpComplex.real = this.real * complex.real - this.image * complex.image;
    tmpComplex.image = this.real * complex.image + this.image * complex.real;
    return tmpComplex;
  }

  // 加法
  sum(complex) {
    const tmpComplex = new Complex();
    tmpComplex.real = this.real + complex.real;
    tmpComplex.image = this.image + complex.image;
    return tmpComplex;
  }

  // 减法
  cut(complex) {
    const tmpComplex = new Complex();
    tmpComplex.real = this.real - complex.real;
    tmpComplex.image = this.image - complex.image;
    return tmpComplex;
  }

  // 获得一个复数的值
  getIntValue() {
    return Math.round(Math.sqrt(Math.abs(this.real * this.real - this.image * this.image)));
  }
}
