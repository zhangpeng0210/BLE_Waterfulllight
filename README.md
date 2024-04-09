### 单双色灯串小程序项目

1. 创建一个【照明】【灯串】产品
2. 选择【产品开发】
3. 选择 【灯串(CW)\_Wi-Fi_Bluetooth LE】
4. 功能定义：标准功能已经添加，另外添加【麦克风音乐律动】
5. 复制 pid，填写到 【project.tuya.json】 的 `productId` 字段
6. 安装依赖，运行 `yarn start:tuya`
7. 去 https://iot.tuya.com/miniapp/ 创建一个面板小程序
8. 打开智能小程序开发者工具，选择导入项目， 关联创建的小程序。
9. 开启虚拟设备，进行开发调试
