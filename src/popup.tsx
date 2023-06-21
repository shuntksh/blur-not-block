import { useState } from "react";

import "./styles.css";

function IndexPopup() {
  const [data, setData] = useState("");

  return (
    <div className="relative m-0 border-non p-0">
      <div className="h-full w-full fixed left-0 bg-gray-50 flex flex-col">
        <div className="form-control mx-8">
          <label className="label cursor-pointer">
            <span className="label-text text-2xl font-bold">Focus</span>
            <input
              type="checkbox"
              className="toggle toggle-lg toggle-success"
            />
          </label>
        </div>
        <div className="flex-1 flex items-end justify-center">
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
