import { get, set, del } from "idb-keyval";

export function createScopedStorage(namespace: string) {
  const key = (k: string) => `${namespace}:${k}`;

  return {
    async get<T>(k: string): Promise<T | undefined> {
      return get<T>(key(k));
    },
    async set<T>(k: string, value: T): Promise<void> {
      await set(key(k), value);
    },
    async remove(k: string): Promise<void> {
      await del(key(k));
    },
  };
}

export const StorageService = createScopedStorage("shell");
