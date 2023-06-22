import { Empty, Radio, Timeline } from "antd";
import { useEffect, useState } from "react";

import "../styles.css";

import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";

import {
  LIST_STORAGE_KEY,
  type WatchLater,
  type WatchLaterList,
  WatchLaterListSchema,
} from "../background";

const extractVideoID = (url: string): string | null => {
  const regex = /(?:v=)([\w-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const groupByDate = (
  videos: WatchLaterList,
): { [key: string]: WatchLater[] } => {
  const result: { [key: string]: WatchLater[] } = {};
  for (const [url, video] of Object.entries(videos)) {
    const date = new Date(video.addedAt).toLocaleDateString();
    if (!result[date]) {
      result[date] = [];
    }
    result[date].push(video);
  }

  for (const [key, value] of Object.entries(result)) {
    result[key] = value.sort((a, b) => {
      return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
    });
  }
  return result;
};

const IndexPage = () => {
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [playlist, setPlaylist] = useState<WatchLaterList>({});

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return new Promise((resolve, reject) => {
        console.log("test");
        chrome.runtime.sendMessage({ command: "deleteAll" }, (response) => {
          if (response && response.success) {
            resolve(response);
          } else {
            reject(response.message);
          }
        });
      });
    },
  });

  const video = playlist ? playlist[selectedVideo] : undefined;

  useEffect(() => {
    const storageChangeHandler = (changes, area) => {
      if (area === "local") {
        const list = WatchLaterListSchema.parse(
          changes[LIST_STORAGE_KEY]?.newValue,
        );
        setPlaylist(list);
        if (selectedVideo && !list[selectedVideo]) {
          setSelectedVideo("");
        }
      }
    };

    chrome.storage.local.get(LIST_STORAGE_KEY, (result) => {
      setPlaylist(WatchLaterListSchema.parse(result[LIST_STORAGE_KEY]));
    });

    chrome.storage.onChanged.addListener(storageChangeHandler);
    return () => {
      chrome.storage.onChanged.removeListener(storageChangeHandler);
    };
  }, []);

  return (
    <div className="flex fixed top-0 left-0 h-[100vh] overflow-hidden flex-col">
      <header className="h-16 w-full flex flex-row items-center justify-between p-6 gap-2">
        <h2 className="text-green-500 font-semibold text-base">
          Blur Not Block{" "}
          <span className="text-gray-500/50 text-sm uppercase">Player</span>
        </h2>
        <div>
          <button
            className="btn btn-sm"
            onClick={() => deleteAllMutation.mutate()}
            disabled={deleteAllMutation.isLoading}>
            Delete All
          </button>
        </div>
      </header>
      <main className="h-[calc(100vh-64px)] min-h-[600px] w-[100vw] relative overflow-hidden flex flex-row">
        <section className="flex-1 min-w-[800px] flex items-start justify-center">
          {video && video.provider === "youtube" ? (
            <div className="m-4 flex flex-col gap-2">
              <iframe
                className="border-0 rounded-md"
                width="640"
                height="360"
                src={`https://www.youtube.com/embed/${extractVideoID(
                  video.url,
                )}`}
              />
              <div className="w-[640px]">
                <h2 className="text-xl text-ellipsis line-clamp-1 font-semibold">
                  {video.title}
                </h2>
                <p>{video.channel}</p>
              </div>
            </div>
          ) : (
            <div
              className="h-full w-full flex items-start justify-center py-4"
              aria-hidden>
              <div className="w-[640px] h-[480px] shadow-md flex items-center justify-center rounded-md border border-gray-500/25 bg-gray-50">
                <Empty description="Select a video to view" />
              </div>
            </div>
          )}
        </section>
        <section className="w-[350px] h-full overflow-y-auto py-4">
          <VideoTimeline
            onSelect={setSelectedVideo}
            videos={playlist}
            selectedVideo={selectedVideo}
          />
        </section>
      </main>
    </div>
  );
};

type VideoTimelineProps = {
  onSelect: (url: string) => void;
  videos: WatchLaterList;
  selectedVideo?: string;
};

const VideoTimeline = ({
  videos,
  onSelect,
  selectedVideo,
}: VideoTimelineProps) => {
  const groupedVideos = groupByDate(videos);

  const deleteMutation = useMutation({
    mutationFn: async (video: WatchLater) => {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { command: "delete", data: video },
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

  const items = Object.entries(groupedVideos).map(([date, videos]) => {
    return {
      children: (
        <div className="flex flex-col transition-shadow duration-75 select-none">
          <div>{date}</div>
          {videos.map((video) => (
            <Radio key={video.url} value={video.url}>
              <div
                className="flex cursor-pointer h-[90px] w-[250px] shadow-sm hover:shadow-md relative rounded-lg"
                style={{
                  border: "1px solid #f0f0f0",
                }}>
                <div className="thumbnail w-[120px] h-[90px] relative">
                  <div
                    className="absolute top-0 left-0 w-full h-full"
                    style={{
                      marginInlineStart: "-1px",
                      marginInlineEnd: "-1px",
                    }}>
                    <img
                      src={video.thumbnailUrl}
                      className="block h-full overflow-clip rounded-l-lg border-none"
                      style={{
                        objectFit: "cover",
                        overflowClipMargin: "content-box",
                      }}
                    />
                  </div>
                </div>
                <div className="rounded-r-lg pl-4 flex-1">
                  <div className="text-ellipsis line-clamp-2">
                    {(video.title || "").replace(" - YouTube", "")}
                  </div>
                  <div className="text-ellipsis line-clamp-1 text-xs text-stone-400">
                    {video.addedAt || ""}
                  </div>
                </div>
                <div className="absolute right-0 h-full w-12 flex items-end bg-white/50 justify-center opacity-25 hover:opacity-100">
                  <div className="tooltip" data-tip="Delete item">
                    <button
                      className="btn btn-circle btn-sm"
                      onClick={() => deleteMutation.mutate(video)}>
                      {deleteMutation.isLoading ? (
                        <span className="loading loading-spinner"></span>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                          stroke="currentColor"
                          className="w-3 h-3 mb-1 text-stone-400">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Radio>
          ))}
        </div>
      ),
      color: "green",
    };
  });
  items.push({
    color: "gray",
    children: (
      <div className="text-gray-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 inline-block mr-1">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
          />
        </svg>
        Watch Later
      </div>
    ),
  });

  return (
    <div className="w-full">
      <Radio.Group
        value={selectedVideo}
        onChange={(ev) => {
          onSelect(ev.target.value);
        }}>
        <Timeline mode="left" items={items} />
      </Radio.Group>
    </div>
  );
};

export default () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <IndexPage />
    </QueryClientProvider>
  );
};
