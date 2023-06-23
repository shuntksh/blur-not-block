import { useEffect, useState } from "react";

import "./styles.css";
import "./popup.css";

import { TimePicker, Tooltip } from "antd";
import dayjs from "dayjs";
import { set } from "zod";

import { useConfig } from "~shared/use-config";

const format = "HH:mm";

const IndexPopup = () => {
  const config = useConfig();
  const [version, setVersion] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [startTime, setStartTime] = useState<dayjs.Dayjs | null>(null);
  const [endTime, setEndTime] = useState<dayjs.Dayjs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enableSchedule, setEnableSchedule] = useState(
    !!config.data?.schedule?.enabled,
  );

  useEffect(() => {
    const manifest = chrome.runtime.getManifest();
    setVersion(manifest.version);
  }, []);

  useEffect(() => {
    setError(null);
  }, [enableSchedule]);

  useEffect(() => {
    setError(null);

    if (config.data?.schedule?.start) {
      const startTime = dayjs(config.data.schedule.start, format);
      setStartTime(startTime);
    }
    if (config.data?.schedule?.end) {
      const endTime = dayjs(config.data.schedule.end, format);
      setEndTime(endTime);
    }
  }, [config.data?.schedule?.start, config.data?.schedule?.end]);

  const handleSetTime = (mode: string, time: dayjs.Dayjs | null) => {
    if (time === null) {
      setStartTime(null);
      setEndTime(null);
      return;
    }

    if (mode === "start") {
      setStartTime(time);
      if (endTime && endTime.isBefore(time)) {
        setEndTime(time.clone().add(1, "minute"));
      }
      if (!endTime) {
        setEndTime(time.clone().add(1, "hour"));
      }
    } else {
      setEndTime(time);
      if (startTime && startTime.isAfter(time)) {
        setStartTime(time.clone().subtract(1, "minute"));
      }
      if (!startTime) {
        setStartTime(time.clone().subtract(1, "hour"));
      }
    }
  };

  const handleSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    let enabled = enableSchedule;
    ev.preventDefault();
    if (enableSchedule) {
      if (!startTime || !endTime) {
        enabled = false;
        setEnableSchedule(false);
      }
      if (startTime.isSame(endTime) || startTime.isAfter(endTime)) {
        setError("Start time must be before end time");
        return;
      }
    }

    config
      .updateConfig({
        schedule: {
          enabled,
          start: startTime?.format(format),
          end: endTime?.format(format),
        },
      })
      .then(() => {
        setShowSettings(false);
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  return (
    <div className="relative m-0 border-non p-0">
      <div className="h-full w-full fixed left-0 flex flex-col bg-gray-200/75">
        <div className="flex items-center justify-center w-full h-6 p-4 select-none">
          <h2 className="text-green-500 font-semibold text-base">
            Blur-Not-Block
          </h2>
          <span className="text-stone-400 text-xs font-semibold ml-1">
            {version}
          </span>
        </div>
        {showSettings ? (
          <div className="flex-1 flex flex-col bg-gray-50 shadow-xl mx-4 rounded-lg relative">
            <div className="absolute right-1 top-1">
              <button
                className="hover:scale-95"
                onClick={() => setShowSettings(false)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form className="flex-1 flex flex-col" onSubmit={handleSubmit}>
              <div className="flex-1 py-2 px-4">
                <h2 className="font-semibold text-md text-stone-800">
                  Settings
                </h2>
                <div className="form-control mt-1">
                  <label className="label cursor-pointer">
                    <span className="label-text">Focus Schedule</span>
                    <input
                      type="checkbox"
                      checked={enableSchedule}
                      onChange={(e) => setEnableSchedule(e.target.checked)}
                      className="checkbox checkbox-success"
                    />
                  </label>
                </div>
                <div className="form-control ml-4">
                  <div className="label">
                    <span className="label-text">From</span>
                    <TimePicker
                      changeOnBlur
                      popupClassName="h-[72px]"
                      disabled={!enableSchedule}
                      format={format}
                      defaultValue={dayjs(config.data?.schedule?.start, format)}
                      onChange={(time) => handleSetTime("start", time)}
                      value={startTime}
                      status={
                        startTime && endTime && startTime.isAfter(endTime)
                          ? "error"
                          : undefined
                      }
                    />
                  </div>
                </div>
                <div className="form-control ml-4">
                  <div className="label">
                    <span className="label-text">Till</span>
                    <TimePicker
                      changeOnBlur
                      popupClassName="h-[72px]"
                      disabled={!enableSchedule}
                      format={format}
                      defaultValue={dayjs(config.data?.schedule?.end, format)}
                      onChange={(time) => handleSetTime("end", time)}
                      value={endTime}
                      status={
                        startTime && endTime && startTime.isAfter(endTime)
                          ? "error"
                          : undefined
                      }
                    />
                  </div>
                </div>
                <div
                  className="w-full flex justify-start items-center text-red-600 rounded-md p-0.5"
                  aria-hidden={!!error}>
                  <span>{error}</span>
                </div>
              </div>
              <div className="flex items-center justify-center p-2 gap-2">
                <button className="btn btn-success btn-sm" type="submit">
                  Apply
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => setShowSettings(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white shadow-xl mx-4 rounded-lg relative">
            {/* <div className="absolute right-1 top-1">
              <Tooltip title="Settings" placement="left">
                <button
                  className="hover:scale-95"
                  onClick={() => setShowSettings(true)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              </Tooltip>
            </div> */}

            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text text-2xl font-bold pr-3">
                  Focus Mode
                </span>
                <input
                  type="checkbox"
                  className="toggle toggle-lg toggle-success"
                  checked={config.enabled}
                  onChange={(e) =>
                    config.updateConfig({ enabled: e.target.checked })
                  }
                />
              </label>
            </div>
          </div>
        )}
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
};

export default IndexPopup;
