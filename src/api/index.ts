import { requestCloud } from '@ray-js/api';

export { LampApi, api } from './LampApi';


// 获取静态资源域名requestCloud
export const getOssUrl = () => {
  return new Promise((resolve, reject) => {
    requestCloud({
      api: 'tuya.m.app.panel.url.get',
      version: '1.0',
      data: {},
      success: (response) => resolve(response),
      fail: (error) => reject(error)
    });
  });
};

// 获取面板多语言
export const getUiIdI18N = (uiId: string): Promise<Record<string, any>> => {
  return new Promise((resolve, reject) => {
    requestCloud({
      api: 'tuya.m.ui.i18n.info.get',
      data: { uiId },
      version: '1.0',
      success: (response) => {
        typeof response === 'string' ? resolve(JSON.parse(response)) : resolve(response);
      },
      fail: (error) => reject(error)
    });
  });
};



