import { useCallback, useEffect, useState } from "react";

export const useAutoPause = (initialValue: boolean = true) => {
  const [autoPause, setAutoPause] = useState(initialValue);

  const autoPauseEventHandler = useCallback(
    (event: Event) => {
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
      video.addEventListener("play", autoPauseEventHandler);
    }

    return () => {
      for (const video of document.body.getElementsByTagName("video")) {
        video.removeEventListener("play", autoPauseEventHandler);
      }
    };
  }, []);

  useEffect(() => {
    for (const video of document.body.getElementsByTagName("video")) {
      video.style.filter = autoPause ? "grayscale(100%) blur(5px)" : "none";
    }

    if (!autoPause) {
      return;
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

    return () => observer.disconnect();
  }, [autoPause]);

  return setAutoPause;
};

export default useAutoPause;

const nodeIsVideoElement = (node: Node): node is HTMLVideoElement => {
  return node.nodeName === "VIDEO";
};

const nodeIsDOMElement = (node: Node): node is HTMLElement => {
  return node instanceof HTMLElement;
};
