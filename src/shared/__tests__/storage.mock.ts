import { vi } from "vitest";

type KeyType =
  | null
  | undefined // Undocumented but seems like supported key type in the current implementation
  | string
  | string[]
  | { [key: string]: unknown };

type listenerType = (
  changes: {
    [key: string]: { newValue?: unknown; oldValue?: unknown };
  },
  area: string,
) => void;

class StorageMock {
  readonly $dummyStorageLen = 0; // TODO: Implement this
  readonly $areaName: string;
  store: { [key: string]: unknown } = {};
  listeners: Set<listenerType> = new Set();

  constructor(areaName = "sync") {
    this.$areaName = areaName;
  }

  get = vi.fn((id: KeyType, cb) =>
    cb ? cb(this.$queryStore(id)) : Promise.resolve(this.$queryStore(id)),
  );

  getBytesInUse = vi.fn((id: KeyType, cb) =>
    cb ? cb(this.$dummyStorageLen) : Promise.resolve(this.$dummyStorageLen),
  );

  set = vi.fn((payload, cb) => {
    const keys = Object.keys(payload);
    const oldValues = structuredClone(this.$queryStore(keys));
    keys.forEach((key) => (this.store[key] = payload[key]));
    const newValues = structuredClone(this.$queryStore(keys));

    const changed = {};
    keys.forEach(
      (key) =>
        (changed[key] = { newValue: newValues[key], oldValue: oldValues[key] }),
    );

    for (const listener of this.listeners) {
      listener(changed, "sync");
    }
    return cb ? cb() : Promise.resolve();
  });

  remove = vi.fn((id: string | string[], cb) => {
    const keys = typeof id === "string" ? [id] : id;
    keys.forEach((key: string) => delete this.store[key]);
    return cb ? cb() : Promise.resolve();
  });

  clear = vi.fn((cb) => {
    this.store = {};
    return cb ? cb() : Promise.resolve();
  });

  onChanged = {
    addListener: vi.fn((cb) => this.listeners.add(cb)),
    removeListener: vi.fn((cb) => this.listeners.delete(cb)),
    hasListener: vi.fn((cb) => this.listeners.has(cb)),
  };

  __RESET_MOCK__ = () => {
    this.store = {};
    this.listeners = new Set();
  };

  $queryStore = (key: KeyType) => {
    if (key === null || typeof key === "undefined") {
      return this.store;
    } else if (typeof key === "string") {
      const result = {};
      result[key] = this.store[key];
      return result;
    } else if (Array.isArray(key)) {
      return key.reduce((result, k) => {
        result[k] = this.store[k];
        return result;
      }, {});
    } else if (typeof key === "object") {
      return Object.keys(key).reduce((result, k) => {
        result[k] = this.store[k] || key[k];
        return result;
      }, {});
    } else {
      throw new Error("Invalid key type");
    }
  };
}

// See https://developer.chrome.com/docs/extensions/reference/storage
export const mockStorage = {
  sync: new StorageMock("sync"),
  local: new StorageMock("local"),
  managed: new StorageMock("managed"),
};
