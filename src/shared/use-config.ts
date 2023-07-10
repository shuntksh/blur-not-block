import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

export const CONFIG_STORAGE_KEY = "__focus_flow_config__";

const format = "HH:mm";
export const ConfigSchema = z.object({
  enabled: z.boolean().default(true),
  passphrase: z.string().optional(),
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
    .optional()
    .default({ enabled: true, start: "09:00", end: "18:00" }),
  youtube: z
    .object({
      hideSecondary: z.boolean().default(true),
      hideComments: z.boolean().default(true),
      hideRelated: z.boolean().default(true),
      autoPause: z.boolean().default(true),
    })
    .optional()
    .default({}),
});

export const defaultConfig = {
  enabled: true,
  passphrase: "",
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

export const refinedSchema = ConfigSchema.refine((data) => {
  if (data.schedule.enabled) {
    const start = dayjs(data.schedule.start, format);
    const end = dayjs(data.schedule.end, format);
    if (!start.isValid() || !end.isValid()) {
      throw new Error("Invalid schedule");
    }
    if (start.isAfter(end)) {
      throw new Error("Start time must be before end time");
    }
  }
  return true;
});

const stringToArrayBuffer = (str: string) => new TextEncoder().encode(str);

const bufferToHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

export const hashPassphrase = async (passphrase: string) => {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    stringToArrayBuffer(passphrase),
  );
  return bufferToHex(buffer);
};

const PartialConfigSchema = ConfigSchema.partial();
export const useConfig = () => {
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

  const setPassphrase = async (passphrase: string) => {
    if (!passphrase) {
      await updateConfig({ passphrase: "" });
      return;
    }
    const hashed = await hashPassphrase(passphrase);
    await updateConfig({ passphrase: hashed });
  };

  const verifyPassphrase = async (passphrase: string) => {
    const hashed = await hashPassphrase(passphrase);
    await refreshConfig();
    return hashed === config?.passphrase;
  };

  const isWithinSchedule = useCallback(() => {
    if (!config?.schedule?.enabled) {
      return true;
    }
    const start = dayjs(config.schedule.start, format);
    const end = dayjs(config.schedule.end, format);
    const now = dayjs();
    return now.isBefore(end) && now.isAfter(start);
  }, [
    config?.enabled,
    config?.schedule?.enabled,
    config?.schedule?.start,
    config?.schedule?.end,
  ]);

  return {
    data: config,
    error,
    isWithinSchedule,
    refreshConfig,
    updateConfig,
    passphrase: {
      set: setPassphrase,
      verify: verifyPassphrase,
      reset: () => setPassphrase(""),
    },
  };
};
