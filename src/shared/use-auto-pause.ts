import { useEffect, useState } from "react";

export const useAutoPauseVideo = (initialValue: boolean = true) => {
  const [autoPause, setAutoPause] = useState(initialValue);

  useEffect(() => {
    const autoPauseEventHandler = (event: Event) => {
      if (autoPause) {
        if (event.currentTarget instanceof HTMLVideoElement) {
          event.currentTarget.pause();
        }
      }
    };

    for (const video of document.body.getElementsByTagName("video")) {
      video.style.filter = autoPause ? "grayscale(100%) blue(5px)" : "none";
      if (autoPause) {
        video.addEventListener("play", autoPauseEventHandler);
        video.pause();
      } else {
        video.removeEventListener("play", autoPauseEventHandler);
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
  }, [autoPause]);

  return setAutoPause;
};

export default useAutoPauseVideo;

const nodeIsVideoElement = (node: Node): node is HTMLVideoElement => {
  return node.nodeName === "VIDEO";
};

const nodeIsDOMElement = (node: Node): node is HTMLElement => {
  return node instanceof HTMLElement;
};
