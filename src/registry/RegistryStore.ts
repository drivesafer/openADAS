import { get, set } from "idb-keyval";
import type { RegistryEntry } from "./types";

const STORE_KEY = "openadas_registry";

export const RegistryStore = {
  async getAll(): Promise<RegistryEntry[]> {
    return (await get<RegistryEntry[]>(STORE_KEY)) ?? [];
  },

  async save(entries: RegistryEntry[]): Promise<void> {
    await set(STORE_KEY, entries);
  },

  async findById(id: string): Promise<RegistryEntry | undefined> {
    const all = await this.getAll();
    return all.find((e) => e.manifest.id === id);
  },

  async upsert(entry: RegistryEntry): Promise<void> {
    const all = await this.getAll();
    const idx = all.findIndex((e) => e.manifest.id === entry.manifest.id);
    if (idx >= 0) {
      all[idx] = entry;
    } else {
      all.push(entry);
    }
    await this.save(all);
  },

  async remove(id: string): Promise<void> {
    const all = await this.getAll();
    await this.save(all.filter((e) => e.manifest.id !== id));
  },

  async getInstalled(): Promise<RegistryEntry[]> {
    const all = await this.getAll();
    return all.filter((e) => e.state === "installed");
  },
};
