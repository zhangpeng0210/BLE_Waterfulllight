/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { handleActions } from 'redux-actions';
import _ from 'lodash';
import { TYSdk } from '@ray-js/ray-panel-core';

import { actions } from '../actions/common';
import { DevInfo } from 'typings';
const {
  devInfoChange,
  deviceChange,
  responseUpdateDp,
  changeDp,
  updateDp,
  cloudChange,
  initStaticPrefix,
  initIoTConfig,
  initFunConfig,
  initBicConfig,
  updateMiscConfig,
  initializedConfig,
  updateAppTheme,
  consoleChange,
  clearConsole,
  toggleShowModel,
  updatePanel,
  updateGroupDPs,
} = actions;

export type Actions = { [K in keyof typeof actions]: ReturnType<typeof actions[K]> };
export type DpValue = boolean | number | string;

export interface DpState {
  switch: boolean;
  [dpCode: string]: DpValue;
}

interface PanelState {
  [dpCode: string]: DpValue;
}

interface Log {
  strCodes: string;
  strIds: string;
  time: string;
  isSend: boolean;
}

type Logs = Array<Log>;

type UpdateDpStatePayload = Partial<DpState> & { [key: string]: DpValue };

/**
 * reducers
 */
const dpState = handleActions(
  {
    [devInfoChange.toString()]: (state, action: Actions['devInfoChange']) => {
      return {
        ...state,
        ...action.payload.state,
      };
    },
    [responseUpdateDp.toString()]: (state, action: Actions['responseUpdateDp']) => ({
      ...state,
      ...action.payload,
    }),
  },
  {}
);


const cloudState = handleActions(
  {
    [cloudChange.toString()]: (state, action: Actions['cloudChange']) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
  {}
)

const panelState = handleActions(
  {
    [updatePanel.toString()]: (state, action: Actions['updatePanel']) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
  {
    homeTab: 'scene',
  }
);

const groupDPs = handleActions(
  {
    [updateGroupDPs.toString()]: (state,action: Actions['updateGroupDPs']) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },{}
);



// 控制是否弹出事件弹框
const showModal = handleActions(
  {
    [toggleShowModel.toString()]: (state, action) => ({
      ...state,
      [action.payload.code]: action.payload.value,
    }),
  },
  {}
);

const devInfo = handleActions(
  {
    [devInfoChange.toString()]: (state, action) => ({
      ...state,
      ...action.payload,
    }),

    [deviceChange.toString()]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
  },
  {}
);

const staticPrefix = handleActions<string>(
  {
    [initStaticPrefix.toString()]: (state, action) => action.payload,
  },
  ''
);

const panelConfig = handleActions(
  {
    [initIoTConfig.toString()]: (state, action: Actions['initIoTConfig']) => {
      return {
        ...state,
        iot: action.payload,
      };
    },
    [initBicConfig.toString()]: (state, action: Actions['initBicConfig']) => {
      return {
        ...state,
        bic: action.payload,
      };
    },
    [initFunConfig.toString()]: (state, action: Actions['initFunConfig']) => {
      return {
        ...state,
        fun: action.payload,
      };
    },
    [updateMiscConfig.toString()]: (state, action: Actions['updateMiscConfig']) => {
      return {
        ...state,
        misc: {
          ...state.misc,
          ...action.payload,
        },
      };
    },
    [initializedConfig.toString()]: state => {
      return {
        ...state,
        initialized: true,
      };
    },
  },
  {}
);

const appTheme = handleActions(
  {
    [updateAppTheme.toString()]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
  },
  {}
);

const formatLogs = (state: Logs, action: { payload: UpdateDpStatePayload }, send: boolean) => {
  const ret = Object.keys(action.payload).reduce((obj, p) => {
    const id = TYSdk.device.getDpIdByCode(p);
    return { ...obj, [id]: action.payload[p] };
  }, {});
  const strIds = JSON.stringify(ret, null, 2);
  const strCodes = JSON.stringify(action.payload, null, 2);
  const date = new Date();
  const time = `[${[
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  ].join(':')}]`;
  const s = [{ strCodes, strIds, time, isSend: send }, ...state];
  return s.slice(0, 30);
};

let isSend = false;

const logs = handleActions<Logs, undefined | UpdateDpStatePayload | DevInfo>(
  {
    [consoleChange.toString()]: state => {
      isSend = true;
      return state;
    },

    [updateDp.toString()]: (state, action: Actions['updateDp']) => {
      isSend = true;
      return formatLogs(state, action, isSend);
    },

    [devInfoChange.toString()]: (state, action: Actions['devInfoChange']) => {
      const formatAction = { payload: action.payload.state };
      return formatLogs(state, formatAction, isSend);
    },

    [responseUpdateDp.toString()]: (state, action: Actions['responseUpdateDp']) => {
      isSend = false;
      return formatLogs(state, action, isSend);
    },
    [changeDp.toString()]: (state, action: Actions['changeDp']) => {
      isSend = false;
      return formatLogs(state, action, isSend);
    },

    [clearConsole.toString()]: () => [],
  },
  []
);

export const reducers = {
  staticPrefix,
  dpState,
  cloudState,
  panelState,
  devInfo,
  panelConfig,
  appTheme,
  logs,
  showModal,
  groupDPs,
};
