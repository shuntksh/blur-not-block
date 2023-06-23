import cssText from "data-text:~styles.css";
import type {
  PlasmoCSConfig,
  PlasmoCreateShadowRoot,
  PlasmoGetStyle,
} from "plasmo";
import { StrictMode } from "react";
import { useEffect } from "react";

import { useApplyImageFilter } from "~shared/use-apply-image-filter";
import { useAutoPauseVideo } from "~shared/use-auto-pause";
import { useConfig } from "~shared/use-config";

export const config: PlasmoCSConfig = {
  matches: ["https://www.amazon.com/*"],
  all_frames: true,
};
export const createShadowRoot: PlasmoCreateShadowRoot = (shadowHost) =>
  shadowHost.attachShadow({ mode: "open" });

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  style.textContent = cssText;
  return style;
};

const App = () => {
  const { enabled } = useConfig();
  const setAutoPauseVideo = useAutoPauseVideo();
  const setGrayscale = useApplyImageFilter(false);

  useEffect(() => {
    setGrayscale(enabled);
    setAutoPauseVideo(enabled);
    return () => {
      setGrayscale(false);
    };
  }, [enabled]);

  return <StrictMode></StrictMode>;
};

export default App;
