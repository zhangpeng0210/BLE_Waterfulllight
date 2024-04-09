import { request } from '@ray-js/api';
import { Notification } from '@ray-js/ray-components-plus';
import Strings from '@/i18n';

export const api = (url: string, params: any = {}) => {
  const { errorTip = false, errorTipMsg } = params ?? {};
  return new Promise((resolve, reject) => {
    delete params.errorTip;
    delete params.errorTipMsg;
    request({
      url: url,
      data: params,
      success: ({ data }) => {
        resolve(data);
      },
      failure: (params) => {
        if (errorTip) {
          Notification.show({
            message: errorTipMsg ?? Strings.getLang('error'), icon: 'error',
          });
        }
        reject(params);
      }
    })
  })
}

export const useRequest = (url: string, params: any = {}) => {
  return api(url, params);
}