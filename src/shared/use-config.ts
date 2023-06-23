import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

export const CONFIG_STORAGE_KEY = "__focus_flow_config__";

const format = "HH:mm";
export const ConfigSchema = z.object({
  enabled: z.boolean().default(true),
  schedule: z
    .object({
      enabled: z.boolean().default(true),
      start: z
        .string()
        .regex(/\d{2}:\d{2}/)
        .default("09:00"),
      end: z
        .string()
        .regex(/\d{2}:\d{2}/)
        .default("18:00"),
    })
    .default({ enabled: true, start: "09:00", end: "18:00" }),
  youtube: z
    .object({
      hideSecondary: z.boolean().default(true),
      hideComments: z.boolean().default(true),
      hideRelated: z.boolean().default(true),
      autoPause: z.boolean().default(true),
    })
    .default({}),
});

export const defaultConfig = {
  enabled: true,
  schedule: {
    enabled: false,
    start: "09:00",
    end: "18:00",
  },
  youtube: {
    hideSecondary: true,
    hideComments: true,
    hideRelated: true,
    autoPause: true,
  },
} as const;

const PartialConfigSchema = ConfigSchema.partial();
export const useConfig = () => {
  const [enabled, setEnabled] = useState(false);
  const [isOutsideSchedule, setIsOutsideSchedule] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [config, setConfig] = useState<
    z.infer<typeof ConfigSchema> | undefined
  >(undefined);

  useEffect(() => {
    refreshConfig();

    const changeListener = (changes: chrome.storage.StorageChange) => {
      const config = changes[CONFIG_STORAGE_KEY];
      if (!config) {
        return;
      }
      setConfig(ConfigSchema.parse(config.newValue));
      setEnabled(config.newValue.enabled);
    };

    chrome.storage.sync.onChanged.addListener(changeListener);

    return () => {
      chrome.storage.sync.onChanged.removeListener(changeListener);
    };
  }, []);

  // // const start = useMemo(
  // //   () =>
  // //     config?.schedule?.start ? dayjs(config.schedule.start, format) : null,
  // //   [config?.schedule?.start],
  // // );
  // // const end = useMemo(
  // //   () => (config?.schedule?.end ? dayjs(config.schedule.end, format) : null),
  // //   [config?.schedule?.end],
  // // );

  // if (config?.enabled && config?.schedule?.enabled) {
  //   if (start && end) {
  //     const now = dayjs();
  //     setIsOutsideSchedule(now.isBefore(start) || now.isAfter(end));
  //   }
  // }

  const refreshConfig = useCallback(async () => {
    chrome.storage.sync.get([CONFIG_STORAGE_KEY], (result) => {
      if (!result[CONFIG_STORAGE_KEY]) {
        setConfig(ConfigSchema.parse(defaultConfig));
        // We don't need to wait for this to finish
        chrome.storage.sync.set({ [CONFIG_STORAGE_KEY]: defaultConfig });
      }
      try {
        const config = ConfigSchema.parse(result[CONFIG_STORAGE_KEY]);
        setConfig(config);
        setEnabled(config.enabled);
      } catch (err) {
        setError(err);
      }
    });
  }, [config]);

  const updateConfig = async (partial: z.infer<typeof PartialConfigSchema>) => {
    const newConfig = ConfigSchema.parse({ ...config, ...partial });
    // Write to storage will trigger config to be updated
    await chrome.storage.sync.set({ [CONFIG_STORAGE_KEY]: newConfig });
  };

  return {
    data: config,
    enabled,
    error,
    refreshConfig,
    updateConfig,
  };
};
