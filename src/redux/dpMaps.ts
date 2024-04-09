import { dpCodes } from "@/config";

const { musicCode, sceneSelectCode, sceneCombineCode, colourCode, sceneListCode, controlCode } = dpCodes;
import { dpParser } from '@/config';

const complexColorMaps = [
  {
    name: 'hue',
    bytes: 2,
  },
  {
    name: 'saturation',
    bytes: 2,
  },
  {
    name: 'value',
    bytes: 2,
  },
  {
    name: 'brightness',
    bytes: 2,
  },
  {
    name: 'temperature',
    bytes: 2,
  },
];
const controlMap = [
  {
    name: 'mode',
    bytes: 1,
  },
  ...complexColorMaps,
];

export default {
  // [colourCode]: [
  //   {
  //     name: 'hue',
  //     bytes: 2,
  //     default: 0,
  //   },
  //   {
  //     name: 'saturation',
  //     bytes: 2,
  //     default: 1000,
  //   },
  //   {
  //     name: 'value',
  //     bytes: 2,
  //     default: 1000,
  //   },
  // ],
  // [controlCode]: controlMap,
  // [musicCode]: dpParser.musicTransformer,
  // [sceneSelectCode]: dpParser.sceneTransformer,
  // [sceneCombineCode]: dpParser.sceneCombineTransformer,
  // [sceneListCode]: dpParser.sceneListTransformer,
}