import { useEffect, useState } from "react";

export const useActiveTabHostName = () => {
  const [hostname, setHostname] = useState("");

  useEffect(() => {
    const queryInfo = { active: true, lastFocusedWindow: true };

    // Retrieve the current active tab when the hook is first run
    chrome.tabs.query(queryInfo, (tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        setHostname(url.hostname);
      }
    });

    // Listener for tab updates
    function onTabUpdated(tabId, changeInfo, tab) {
      if (changeInfo.status === "complete" && tab.active) {
        const url = new URL(tab.url);
        setHostname(url.hostname);
      }
    }

    // Listener for when the tab becomes active
    function onTabActivated(activeInfo) {
      chrome.tabs.get(activeInfo.tabId, function (tab) {
        const url = new URL(tab.url);
        setHostname(url.hostname);
      });
    }

    chrome.tabs.onUpdated.addListener(onTabUpdated);
    chrome.tabs.onActivated.addListener(onTabActivated);

    // Cleanup
    return () => {
      chrome.tabs.onUpdated.removeListener(onTabUpdated);
      chrome.tabs.onActivated.removeListener(onTabActivated);
    };
  }, []);

  return hostname;
};
