import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CONFIG_STORAGE_KEY, defaultConfig, useConfig } from "../use-config";
import { mockStorage } from "./storage.mock";

describe("useConfig", () => {
  beforeEach(() => {
    vi.stubGlobal("chrome", {
      storage: {
        ...mockStorage,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    mockStorage.sync.__RESET_MOCK__();
  });

  it("should return default config when no config is stored", async () => {
    chrome.storage.sync;
    chrome.storage.onChanged;
    const { result, rerender } = renderHook(() => useConfig());
    expect(result.current.data).toEqual(defaultConfig);
    expect(mockStorage.sync.set).toHaveBeenCalled();
    expect(mockStorage.sync.get).toHaveBeenCalled();
  });

  it("should be able to enable and disable", async () => {
    const { result, rerender } = renderHook(() => useConfig());
    expect(result.current.data.enabled).toBe(true);

    await result.current.updateConfig({ enabled: false });
    expect(mockStorage.sync.store[CONFIG_STORAGE_KEY]["enabled"]).toBe(false);

    rerender();
    expect(result.current.data.enabled).toBe(false);

    await result.current.updateConfig({ enabled: true });
    expect(mockStorage.sync.store[CONFIG_STORAGE_KEY]["enabled"]).toBe(true);

    rerender();
    expect(result.current.data.enabled).toBe(true);
  });

  it("should be able to set and verify passphrase", async () => {
    const { result, rerender } = renderHook(() => useConfig());
    expect(result.current.data.passphrase).toBe(""); // Default is empty

    await result.current.passphrase.set("test");
    expect(mockStorage.sync.store[CONFIG_STORAGE_KEY]["passphrase"]).not.toBe(
      "",
    );

    rerender();
    expect(result.current.data.passphrase).not.toBe("");
    expect(result.current.passphrase.verify("test")).resolves.toBe(true);
    expect(result.current.passphrase.verify("test2")).resolves.toBe(false);

    await result.current.passphrase.reset();
    expect(mockStorage.sync.store[CONFIG_STORAGE_KEY]["passphrase"]).toBe("");

    rerender();
    expect(result.current.data.passphrase).toBe("");
  });

  it("should be able to set and verify schedule", async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(() => useConfig());
    expect(result.current.data.schedule.enabled).toBe(false); // Default is empty
    
  });
});
