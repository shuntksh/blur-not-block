import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import cssText from "data-text:~styles.css";
import type {
  PlasmoCSConfig,
  PlasmoCreateShadowRoot,
  PlasmoGetStyle,
} from "plasmo";
import { StrictMode } from "react";
import { useEffect, useRef, useState } from "react";

import { useApplyImageFilter } from "~shared/use-apply-image-filter";
import { useAutoPauseVideo } from "~shared/use-auto-pause";
import { useConfig } from "~shared/use-config";

import type { WatchLater } from "../background";

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

type Meta = {
  url?: string;
  title: string;
  description: string;
  channel: string;
  channelUrl: string;
  thumbnailUrl: string;
};

const extractVideoID = (url: string): string | null => {
  const regex = /(?:v=)([\w-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const extractVideoMetadata = (): Meta => {
  const title =
    document.querySelector("meta[name='title']")?.getAttribute("content") ||
    window.document.title;
  const description =
    document
      .querySelector("meta[name='description']")
      ?.getAttribute("content") || "";

  const channel =
    document
      .querySelector("span[itemprop='author'] link[itemprop='name']")
      ?.getAttribute("content") || "";

  const channelUrl =
    document
      .querySelector("span[itemprop='author'] link[itemprop='url']")
      ?.getAttribute("href") || "";

  const id = extractVideoID(window.location.href);

  return {
    url: window.location.href,
    title,
    description,
    channel,
    channelUrl,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
  };
};

const App = () => {
  const [showModal, setShowModal] = useState(false); // [true, false]
  const [timer, setTimer] = useState(-1); // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const [videoPage, setVideoPage] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);
  const setGrayscale = useApplyImageFilter(false);
  const setAutoPause = useAutoPauseVideo(false);
  const config = useConfig();

  const submitMutation = useMutation({
    mutationFn: async (video: WatchLater) => {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { command: "add", data: video },
          (response) => {
            if (response && response.success) {
              resolve(response);
            } else {
              reject(response.message);
            }
          },
        );
      });
    },
  });

  const [meta, setMeta] = useState<Meta>(undefined);

  useEffect(() => {
    const handler = () => {
      console.info("yt-navigate-finish", config.enabled, window.location.href);

      setTimer(-1);
      setMeta(undefined);

      const url = new URL(window.location.href);

      if (url.hostname === "www.youtube.com" && url.pathname === "/") {
        console.log("Is YouTube Top Page");
        document.body.style.overflow = "auto";
        setShowModal(false);
        setAutoPause(config.enabled);
        setVideoPage(config.enabled);
        setGrayscale(config.enabled);
      }

      // If the current page is a video page, pause all videos
      else if (
        window.location.href.startsWith("https://www.youtube.com/watch") ||
        window.location.href.startsWith("https://www.youtube.com/shorts")
      ) {
        setAutoPause(config.enabled);
        setShowModal(config.enabled);
        setGrayscale(config.enabled);
        if (config.enabled) {
          document.documentElement.scrollTop = 0;
        }
        document.body.style.overflow = config.enabled ? "hidden" : "auto";
        setVideoPage(config.enabled);
      } else {
        setVideoPage(config.enabled);
      }
    };

    console.info("Config Loaded", config.enabled);
    handler();

    // TODO: Use DOMLoadedEvent instead
    const timer = window.setTimeout(() => {
      handler();
    }, 2000);

    modalRef.current?.showModal();

    window.addEventListener("yt-navigate-finish", handler);

    return () => {
      console.log("cleanup event listeners");
      window.clearTimeout(timer);
      window.removeEventListener("yt-navigate-finish", handler);
    };
  }, [config.enabled]);

  // Effect for countdown timer. If the timer is 0, close the modal
  // Ideally this should be in a separate component
  useEffect(() => {
    if (timer === 0) {
      setTimer(-1);
      setShowModal(false);
      setAutoPause(false);
    } else if (timer > 0) {
      const token = window.setTimeout(() => {
        setTimer((_timer) => _timer - 1);
      }, 1000 + (TIMEOUT - timer) * 200);

      return () => clearTimeout(token);
    }
  }, [timer]);

  const handleAddToWatchLater = () => {
    const meta = extractVideoMetadata();
    console.log(meta);
    submitMutation.mutate({ ...meta, provider: "youtube" });
    setMeta(meta);
  };

  // If not video page or modal is closed, restore the scroll
  if (!videoPage || !showModal) {
    document.body.style.overflow = "auto";
    return null;
  }

  return (
    <StrictMode>
      <div className="w-[100vw] h-[100vh] flex relative items-center justify-center bg-stone-800/90">
        <div className="w-[500px] h-[400px] card shadow-lg rounded-2xl border-4 border-red-700 bg-red-100 box-border">
          {timer === -1 ? (
            <div className="w-full h-full relative flex rounded-xl overflow-hidden items-center justify-center flex-col">
              {submitMutation.isError && <div>Error!</div>}
              <div className="flex-1 flex items-center flex-col justify-center">
                <div className="w-[100px] h-[100px] rounded-2xl border-4 border-red-700 bg-red-600 shadow-lg flex items-center justify-center hover:scale-105 transition-transform duration-200 ease-in-out hover:-rotate-2">
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
                    className="btn btn-lg relative shadow-sm hover:shadow-none inline-flex items-center justify-center group border-4 text-green-600 bg-green-300 border-green-600 hover:bg-green-400/75 hover:border-green-600 hover:scale-95"
                    onClick={() =>
                      (window.location.href = "https://www.youtube.com/")
                    }>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="3"
                      stroke="currentColor"
                      className="h-full pr-1 ">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                      />
                    </svg>
                    Go Back
                  </button>
                  <button
                    className="btn btn-lg shadow-sm relative inline-flex group items-center justify-center border-4 bg-stone-100 text-stone-500 w-[280px] border-stone-500 hover:scale-95 hover:shadow-none hover:bg-stone-200"
                    onClick={handleAddToWatchLater}
                    disabled={submitMutation.isLoading}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="3"
                      stroke="currentColor"
                      className="h-full pr-1">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>I might want to watch it later</span>
                  </button>
                </div>
              </div>
              <div className="transition-all duration-100 pb-1 flex-grow-0 flex flex-row items-end text-xl text-stone-600 hover:scale-95 mb-1">
                <button onClick={() => setTimer(TIMEOUT)}>
                  I really need to watch this video.
                </button>
              </div>

              <button
                className="btn btn-circle btn-outline absolute top-2 right-2 shadow-sm inline-flex border-2 items-center justify-center bg-white text-stone-500 border-stone-500 hover:scale-95 hover:shadow-none hover:border-2 hover:bg-white"
                onClick={() =>
                  (window.location.href = "https://www.youtube.com/")
                }>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="4"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              {submitMutation.isSuccess && meta && <LoadingScreen {...meta} />}
            </div>
          ) : (
            <div className="w-full h-full relative flex overflow-hidden items-center justify-center flex-col">
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
                    className="btn btn-lg  border-4 text-green-800 bg-green-400 border-green-600 hover:bg-green-400/75 hover:border-green-600 hover:scale-95"
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

const LoadingScreen = ({
  title,
  description,
  thumbnailUrl: thumbnail,
}: Meta) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setShow(false);
      window.location.href = "https://www.youtube.com/";
    }, 1500);

    return () => {
      clearTimeout(timer1);
    };
  }, [show]);

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
      <div
        className={`${
          show ? "show" : "hide"
        } loading-container shadow-xl card bg-white border-2 border-gray-300 w-96 h-96 flex items-center justify-center`}>
        <div className="card-actions justify-center mt-2 text-xl">
          <span>Uploading</span>
          <span className="loading loading-xl loading-spinner"></span>
        </div>
      </div>
    </div>
  );
};

const c = new QueryClient();
export default () => (
  <QueryClientProvider client={c}>
    <App />
  </QueryClientProvider>
);
