import cssText from "data-text:~styles.css";
import type {
  PlasmoCSConfig,
  PlasmoCreateShadowRoot,
  PlasmoGetStyle,
} from "plasmo";
import { StrictMode } from "react";
import { useEffect, useRef, useState } from "react";

import { useApplyImageFilter } from "~shared/use-apply-image-filter";
import { useAutoPause } from "~shared/use-auto-pause";

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*"],
  all_frames: true,
};
export const createShadowRoot: PlasmoCreateShadowRoot = (shadowHost) =>
  shadowHost.attachShadow({ mode: "open" });

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  style.textContent = cssText;
  return style;
};

const TIMEOUT = 10;
const App = () => {
  const [isOpen, setOpen] = useState(true);
  const [timer, setTimer] = useState(-1); // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const [videoPage, setVideoPage] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);
  const setGrayscale = useApplyImageFilter();
  const setAutoPause = useAutoPause(true);

  useEffect(() => {
    console.info("Content Script Loaded");
    const ytNavigationEventHandler = () => {
      console.info("yt-navigate-finish", window.location.href);
      setTimer(-1);
      setAutoPause(true);

      if (window.location.href === "https://www.youtube.com") {
        document.body.style.overflow = "auto";
        setVideoPage(false);
        setGrayscale(true);
      }

      // If the current page is a video page, pause all videos
      else if (
        window.location.href.startsWith("https://www.youtube.com/watch") ||
        window.location.href.startsWith("https://www.youtube.com/shorts")
      ) {
        setGrayscale(true);
        document.body.style.overflow = "hidden";

        // Remove the secondary column
        const secondary = document.querySelector("#secondary");
        if (secondary) {
          for (const child of secondary.children) {
            child.remove();
          }
        }
        setVideoPage(true);
        setOpen(true);
      } else {
        setVideoPage(false);
      }
    };

    ytNavigationEventHandler();

    const timer = window.setTimeout(() => {
      ytNavigationEventHandler();
    }, 2000);

    modalRef.current?.showModal();

    window.addEventListener("yt-navigate-finish", ytNavigationEventHandler);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(
        "yt-navigate-finish",
        ytNavigationEventHandler,
      );
    };
  }, []);

  useEffect(() => {
    if (timer === 0) {
      setOpen(false);
      setTimer(-1);
      setAutoPause(false);
    } else if (timer > 0) {
      const token = window.setTimeout(() => {
        setTimer((_timer) => _timer - 1);
      }, 1000 + (TIMEOUT - timer) * 200);

      return () => clearTimeout(token);
    }
  }, [timer]);

  if (!videoPage || !isOpen) {
    document.body.style.overflow = "auto";

    return null;
  }

  return (
    <StrictMode>
      <div className="w-[100vw] h-[100vh] flex relative items-center justify-center bg-stone-800/90">
        <div className="divide-y w-[500px] h-[400px] bg-white shadow-lg rounded-lg ">
          {timer === -1 ? (
            <div className="w-full h-full relative flex overflow-hidden items-center justify-center flex-col">
              <div className="flex-1 flex items-center flex-col justify-center">
                <div className="w-[100px] h-[100px] rounded-xl border-4 border-red-700 bg-red-600 shadow-lg mb-6 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-24 h-24 text-white">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-3xl font-semibold leading-6 text-gray-600">
                    Read this before you watch this video
                  </h3>
                  <div className="mt-10">
                    <p className="px-12">
                      <span
                        className="text-4xl leading-[4rem] text-stone-900 mt-6 py-0.5 px-1 bg-transparent bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-100 decoration-clone"
                        style={{
                          margin: "0 -0.4em",
                          padding: "0.1em 0.4em",
                          borderRadius: "0.8em 0.3em",
                        }}>
                        I am not sure if I really want to watch this video right
                        now.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-grow-0">
                <div className="flex gap-2 mb-16 flex=0">
                  <button
                    className="btn btn-lg  border-4 text-green-600 bg-green-300 border-green-600 hover:bg-green-400/75 hover:border-green-600"
                    onClick={() => {
                      window.location.href = "https://www.youtube.com/";
                    }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="3"
                      stroke="currentColor"
                      className="w-10 h-10 pr-1">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                      />
                    </svg>
                    Go Back
                  </button>
                  <button className="btn btn-lg border-4 text-stone-500/50 w-[280px] border-stone-500/50 hover:bg-gray-300/50 hover:border-stone-500/50">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="3"
                      stroke="currentColor"
                      className="w-10 h-10 pr-1">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    I might want to watch it later
                    {false && <span className="loading loading-spinner"></span>}
                  </button>
                </div>
              </div>
              <div className="pb-1 flex-grow-0 flex flex-row items-end">
                <button onClick={() => setTimer(TIMEOUT)}>
                  I really need to watch this video.
                </button>
              </div>

              <button
                className="btn btn-circle btn-outline absolute top-2 right-2"
                onClick={() => {
                  window.location.href = "https://www.youtube.com/";
                }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className="w-full h-full relative flex overflow-hidden items-center justify-center flex-col bg-red-500/25">
              <div className="flex-1 flex items-center flex-col justify-center">
                <div className="w-[100px] h-[100px] rounded-xl border-4  border-red-700 bg-red-600 shadow-lg mb-6 flex items-center justify-center">
                  <span className="font-extrabold text-6xl text-white">
                    {timer}
                  </span>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-3xl font-semibold leading-6 text-gray-600">
                    Do I really have to watch this video?
                  </h3>
                  <div className="mt-10">
                    <p className="px-12">
                      <span
                        className="text-4xl leading-[4rem] text-stone-900 mt-6 py-0.5 px-1 bg-transparent bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-100 decoration-clone"
                        style={{
                          margin: "0 -0.4em",
                          padding: "0.1em 0.4em",
                          borderRadius: "0.8em 0.3em",
                        }}>
                        I have {TIMEOUT} seconds to decide if this video really
                        worth my time right now.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex gap-2 mb-16 flex=0">
                  <button
                    className="btn btn-lg  border-4 text-green-800 bg-green-400 border-green-600 hover:bg-green-400/75 hover:border-green-600"
                    onClick={() => setTimer(-1)}>
                    Never mind. I changed my mind. I want to watch this video
                    later.
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StrictMode>
  );
};

export default App;
