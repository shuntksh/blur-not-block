import { defineConfig } from "vitest/dist/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.mts"],
  },
});
