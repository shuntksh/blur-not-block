import { useCallback, useEffect, useState } from "react";

export const useAutoPause = (initialValue: boolean = true) => {
  const [autoPause, setAutoPause] = useState(initialValue);
  console.log("YYY", autoPause);

  const autoPauseEventHandler = useCallback(
    (event: Event) => {
      console.log("HHH", autoPause);

      if (autoPause) {
        if (event.currentTarget instanceof HTMLVideoElement) {
          event.currentTarget.pause();
        }
      }
    },
    [autoPause],
  );

  useEffect(() => {
    for (const video of document.body.getElementsByTagName("video")) {
      video.style.filter = autoPause ? "grayscale(100%) blue(5px)" : "none";
      if (autoPause) {
        video.pause();
      } else {
        video.removeEventListener("play", autoPauseEventHandler);
      }
    }
  }, [autoPause]);

  useEffect(() => {
    for (const video of document.body.getElementsByTagName("video")) {
      video.addEventListener("play", autoPauseEventHandler);
      video.style.filter = initialValue ? "grayscale(100%) blue(5px)" : "none";
      if (initialValue) {
        video.pause();
        video.autoplay = false;
        video.muted = true;
      }
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (nodeIsVideoElement(node)) {
              node.addEventListener("play", autoPauseEventHandler);
            } else if (nodeIsDOMElement(node)) {
              for (const video of node.getElementsByTagName("video")) {
                video.addEventListener("play", autoPauseEventHandler);
              }
            }
          }
        }
      });
    });

    let observerConfig = {
      childList: true,
      subtree: true,
    };

    observer.observe(document.body, observerConfig);

    return () => {
      observer.disconnect();
      for (const video of document.body.getElementsByTagName("video")) {
        video.removeEventListener("play", autoPauseEventHandler);
      }
    };
  }, []);

  return setAutoPause;
};

export default useAutoPause;

const nodeIsVideoElement = (node: Node): node is HTMLVideoElement => {
  return node.nodeName === "VIDEO";
};

const nodeIsDOMElement = (node: Node): node is HTMLElement => {
  return node instanceof HTMLElement;
};
