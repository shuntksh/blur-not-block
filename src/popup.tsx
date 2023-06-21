import { useEffect, useState } from "react";

import "./styles.css";
import "./popup.css";

import { useActiveTabHostName } from "~shared/use-active-tab";
import { useConfig } from "~shared/use-config";

function IndexPopup() {
  const config = useConfig();
  const activeTab = useActiveTabHostName();
  const [version, setVersion] = useState("");

  useEffect(() => {
    const manifest = chrome.runtime.getManifest();
    setVersion(manifest.version);
  }, []);

  return (
    <div className="relative m-0 border-non p-0">
      <div className="h-full w-full fixed left-0 flex flex-col bg-gray-100/75">
        <div className="flex items-center justify-center w-full h-6 p-4 ">
          <span className="text-green-500 font-semibold text-base">
            FocusFlow
          </span>
          <span className="text-stone-400 text-xs font-semibold ml-1">
            {version}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center bg-white shadow-xl mx-4 rounded-lg">
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text text-2xl font-bold pr-3">
                Focus Mode
              </span>
              <input
                type="checkbox"
                className="toggle toggle-lg toggle-success"
                checked={config.enabled}
                onChange={(e) => {
                  config.updateConfig({ enabled: e.target.checked });
                  if (e.target.checked) {
                    setTimeout(() => {
                      window.close();
                    }, 500);
                  }
                }}
              />
            </label>
          </div>
        </div>
        <div className="flex items-center justify-center h-6 w-full">
          <a
            className="link link-neutral"
            href={`${chrome.runtime.getURL("tabs/player.html")}`}
            target="_focus_flow_player">
            Open Player
          </a>
        </div>
      </div>
    </div>
  );
}

export default IndexPopup;
