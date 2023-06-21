import { Empty, Radio, Timeline } from "antd";
import { useEffect, useState } from "react";

import "../styles.css";

import {
  LIST_STORAGE_KEY,
  type WatchLater,
  type WatchLaterList,
  WatchLaterListSchema,
  WatchLaterSchema,
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

  const video = playlist ? playlist[selectedVideo] : undefined;

  useEffect(() => {
    const storageChangeHandler = (changes, area) => {
      if (area === "local") {
        setPlaylist(changes[LIST_STORAGE_KEY]?.newValue);
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
      <header className="h-16 w-full">test</header>
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

export default IndexPage;

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
  const items = Object.entries(groupedVideos).map(([date, videos]) => {
    return {
      children: (
        <div className="flex flex-col transition-shadow duration-75">
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
              </div>
            </Radio>
          ))}
        </div>
      ),
      color: "green",
    };
  });
  items.push({ color: "green", children: <div>Done!</div> });
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
