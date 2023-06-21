import { z } from "zod";

export const sqlite = {
  db: undefined,
};

export const LIST_STORAGE_KEY = "watch-later-list";

export const WatchLaterSchema = z.object({
  url: z.string().url(),
  provider: z.enum(["youtube"]),
  title: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  description: z.string().optional().default(""),
  channel: z.string().optional().default(""),
  channelUrl: z.string().optional().default(""),
  addedAt: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
  favorite: z.boolean().default(() => false),
  watched: z.boolean().default(() => false),
});
export type WatchLater = z.infer<typeof WatchLaterSchema>;

export const WatchLaterListSchema = z
  .record(z.string().url(), WatchLaterSchema)
  .default({});
export type WatchLaterList = z.infer<typeof WatchLaterListSchema>;

class VideoList {
  #cache = WatchLaterListSchema.parse({});
  #keys = Object.keys(this.#cache);
  #byDates: { [key: string]: string } = {};
  constructor() {}

  async init() {
    // Load from local storage
    console.log("initializing");
    const data = await chrome.storage.local.get(LIST_STORAGE_KEY);
    this.#updateCacheAndSortKeys(data[LIST_STORAGE_KEY]);
    console.log(data[LIST_STORAGE_KEY], this.#keys);
  }

  async add(video: WatchLater) {
    console.log("adding", video);
    video = WatchLaterSchema.parse(video);

    this.#cache[video.url] = video;
    this.#keys.unshift(video.url);
    await this.#saveCacheToDisk();
  }

  #saveCacheToDisk = async () => {
    console.log("saving", this.#cache);
    await chrome.storage.local.set({ [LIST_STORAGE_KEY]: this.#cache });
  };

  #updateCacheAndSortKeys = (data: unknown) => {
    this.#cache = WatchLaterListSchema.parse(data);

    const array = Object.keys(this.#cache);
    array.sort(
      (a, b) =>
        new Date(this.#cache[a].addedAt).getTime() -
        new Date(this.#cache[b].addedAt).getTime(),
    );

    this.#keys = array;

    this.#byDates = {};
    for (const key of this.#keys) {
      const date = this.#cache[key].addedAt.split("T")[0];
    }
  };
}
const videoList = new VideoList();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "add") {
    (async () => {
      try {
        const item = WatchLaterSchema.parse(request.data);
        await videoList.add(item);
        sendResponse({ success: true, message: "added" });
      } catch (err) {
        console.error(err);
        sendResponse({ success: false, message: err?.message || "error" });
      }
    })();
    return true;
  }
});

const main = async () => {
  await videoList.init();
};

main()
  .then(() => console.log("Ready"))
  .catch((err) => console.error(err));
