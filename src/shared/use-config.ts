import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

import { CONFIG_STORAGE_KEY, ConfigSchema, defaultConfig } from "../background";

const PartialConfigSchema = ConfigSchema.partial();
export const useConfig = () => {
  const [enabled, setEnabled] = useState(false);
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

  const updateConfig = (partial: z.infer<typeof PartialConfigSchema>) => {
    const newConfig = ConfigSchema.parse({ ...config, ...partial });
    // Write to storage will trigger config to be updated
    chrome.storage.sync.set({ [CONFIG_STORAGE_KEY]: newConfig });
  };

  return { data: config, enabled, error, refreshConfig, updateConfig };
};
