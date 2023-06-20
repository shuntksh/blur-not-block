import { useState } from "react";

import "./styles.css";

function IndexPopup() {
  const [data, setData] = useState("");

  return (
    <div className="bg-gray-200 relative m-0 border-none p-0 align-bottom">
      <div className="w-[400px] h-[400px] ">
        <a
          className="link link-neutral"
          href={`${chrome.runtime.getURL("tabs/player.html")}`}
          target="_focus_flow_player">
          Open Player
        </a>
      </div>
    </div>
  );
}

export default IndexPopup;
