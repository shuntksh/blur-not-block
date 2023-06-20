import cssText from "data-text:~styles.css";
import type {
  PlasmoCSConfig,
  PlasmoCreateShadowRoot,
  PlasmoGetStyle,
} from "plasmo";
import { StrictMode } from "react";
import { useEffect } from "react";

import { useApplyImageFilter } from "~shared/use-apply-image-filter";

export const config: PlasmoCSConfig = {
  matches: ["https://www.amazon.com/*", "https://twitter.com/*"],
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
  const setGrayscale = useApplyImageFilter();

  useEffect(() => {
    setGrayscale(true);
    document.body.style.filter = "grayscale(100%)";
    return () => {
      setGrayscale(false);
    };
  }, []);

  return <StrictMode></StrictMode>;
};

export default App;
