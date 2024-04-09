# 涂鸦 dp 协议性数据转换工具库

## 支持的协议类型

### 普通型协议

指可转为一个对象数据的协议，如：彩光协议 color_data
0000 03e8 03e8 可转为 {hue:0, saturation: 1000, value: 1000}

### 循环型协议

指协议可转化为一个数组数据，如：循环定时 timer
00 00 03 00 2f 04 00 06 00 1f 可转为[{startHour: 0, startMinute: 0, endHour: 3, endMinute: 0, temp: 47},{startHour: 4, startMinute: 0, endHour: 6, endMinute: 0, temp: 31}]

### 条件型协议

指协议中会根据某一个字段属性的值不同而协议支持的字段不同，如 照明的混光场景 dp

### 多版本协议

指协议存在一个版本字段属性，不同版本会有不同的解析，如 电热水器的定时周程序 dp

### 其他

## 支持数据类型

### 数值类型 number

### 数值类型 numberBySeparate

### 布尔类型 boolean

### 字符串 string

### 周 week

### 二进制位 bit

### 子节点 child

### 自定义 custom

### 示例
