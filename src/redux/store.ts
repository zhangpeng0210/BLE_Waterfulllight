import { combineReducers, createStore, applyMiddleware, compose } from 'redux';
import { createLogger } from 'redux-logger';
import { createDpKitMiddleware } from '@/libs/@tuya-rn/tuya-dp-kit';
import putDpData from '@/utils/dp';
import { reducers as commonReducers } from './reducers/common';
import { reducers as theme } from './reducers/theme';
import dpMaps from './dpMaps';

const reducers = {
  ...commonReducers,
  ...theme,
};

type Reducers = typeof reducers;

export type ReduxState = { [K in keyof Reducers]: ReturnType<Reducers[K]> };

export const rootReducers = combineReducers(reducers);

const isDebuggingInChrome = true;
const logger = createLogger({
  predicate: () => isDebuggingInChrome,
  collapsed: true,
  duration: true,
});

const dpKitMiddleware = createDpKitMiddleware({
  putDeviceData: data => {
    return putDpData(data);
  },
  rawDpMap: dpMaps,
  sendDpOption: {},
});

const middleware = isDebuggingInChrome ? [logger, dpKitMiddleware] : [dpKitMiddleware];


function configureStore(initialState?: Partial<ReduxState>) {
  const appliedMiddleware = applyMiddleware(...middleware);

  const store = createStore(rootReducers, initialState, compose(appliedMiddleware));
  return store;
}

export const store = configureStore();
