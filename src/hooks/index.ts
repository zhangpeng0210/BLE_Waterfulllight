import { useEffect } from "react";
import { TYSdk } from "@ray-js/ray-panel-core";
import { useSelector } from "@/redux";
import { setNavigationBarColor, setNavigationBarTitle } from "@ray-js/api";

export const useTopBarTheme = () => {
  const isDarkTheme = useSelector((state) => state.theme.type === "dark");
  const backgroundColor = isDarkTheme ? "#212121" : "#212121";
  const frontColor = isDarkTheme ? "#ffffff" : "#ffffff";

  useEffect(() => {
    setNavigationBarColor({
      frontColor,
      backgroundColor,
      animation: {
        duration: 300,
        timingFunc: "linear",
      },
    });
  }, []);
};

export const useSetTopBarTitle = (title?: string) => {
  const titleText = title ?? TYSdk.devInfo.name;
  useEffect(() => {
    const titleRes =
      titleText.length > 14 ? `${titleText.slice(0, 14)}...` : titleText;
    setNavigationBarTitle({
      title: titleRes,
    });
  }, [title]);
};
