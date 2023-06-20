import { useEffect, useState } from "react";
import { z } from "zod";

export const ConfigSchema = z.object({
  youtube: z.object({
    hideSecondary: z.boolean().default(true),
    hideComments: z.boolean().default(true),
    hideRelated: z.boolean().default(true),
    autoPause: z.boolean().default(true),
  }),
});

export class Config {
    #config: z.infer<typeof ConfigSchema>;

    constructor(config: z.infer<typeof ConfigSchema>) {
        this.#config = config;
    }
}

export const useConfig = () => {
  const [config, setConfig] = useState(
    ConfigSchema.parse(JSON.parse(localStorage.getItem("config") ?? "{}")),
  );

  useEffect(() => {
    chrome.storage.sync.onChanged.addListener((changes) => {});
  }, []);
};
