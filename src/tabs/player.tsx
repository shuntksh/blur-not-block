import { useEffect, useState } from "react";

import {
  LIST_STORAGE_KEY,
  type WatchLaterList,
  WatchLaterListSchema,
} from "../background";

const IndexPage = () => {
  const [playlist, setPlaylist] = useState<WatchLaterList>({});

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

  return <div>{JSON.stringify(playlist)}</div>;
};

export default IndexPage;
