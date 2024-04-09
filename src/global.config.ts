import { GlobalConfig } from '@ray-js/types';

export const tuya = {
  window: {
    backgroundColor: '#212121',
    navigationBarTitleText: '',
    navigationBarBackgroundColor: '#303030',
    navigationBarTextStyle: 'white',
  },
  dependencies: {
    BaseKit: '2.0.5',
    DeviceKit: '2.0.5',
    MiniKit: '2.0.6',
    TYKit: '2.0.5',
  },
  pageWrapper: ['@ray-js/ray-components-plus/lib/CommonWrp'],
};

const globalConfig: GlobalConfig = {
  basename: '',
};

export default globalConfig;
