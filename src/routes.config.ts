import { Routes, TabBar } from "@ray-js/types";

export const routes: Routes = [
  {
    route: "/",
    path: "/pages/index",
    name: "Home",
  },  
  {
    route: "/treeTopStar",
    path: "/pages/treeTopStar/index",
    name: "TreeTopStar",
  },  

  {
    route: "/sceneSourcePiexl",
    path: "/pages/scenesDetail/sceneSourcePiexl/index",
    name: "SceneSourcePiexl",
  },
  {
    route: "/sceneSourceGif",
    path: "/pages/scenesDetail/sceneSourceGif/index",
    name: "SceneSourceGif",
  },

  {
    route: "/schedule",
    path: "/pages/schedule/index",
    name: "Schedule",
  },
  {
    route: "/countdown",
    path: "/pages/countdown/index",
    name: "Countdown",
  },
  {
    route: "/diyList/smear",
    path: "/pages/diyList/smear/index",
    name: "Smear",
  }, 
  {
    route: "/diyList",
    path: "/pages/diyList/index",
    name: "DIY",
  },  
  {
    route: "/textList",
    path: "/pages/textList/index",
    name: "TextList",
  },  
  {
    route: "/textList/text",
    path: "/pages/textList/text/index",
    name: "Text",
  },  
];

export const tabBar = {};
