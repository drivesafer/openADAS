import type { MiniAppManifest } from "@/sdk/types";
import { RegistryStore } from "./RegistryStore";
import type { RegistryEntry } from "./types";

export const InstallManager = {
  async seedBuiltins(manifests: MiniAppManifest[]): Promise<void> {
    const existing = await RegistryStore.getAll();
    const existingIds = new Set(existing.map((e) => e.manifest.id));

    for (const m of manifests) {
      if (!existingIds.has(m.id)) {
        await RegistryStore.upsert({
          manifest: m,
          source: "builtin",
          state: "installed",
          installedAt: Date.now(),
        });
      }
    }
  },

  async installRemote(
    manifest: MiniAppManifest,
    sourceUrl: string,
  ): Promise<void> {
    const entry: RegistryEntry = {
      manifest,
      source: "remote",
      sourceUrl,
      state: "installed",
      installedAt: Date.now(),
      cachedVersion: manifest.version,
    };
    await RegistryStore.upsert(entry);

    if (manifest.entryUrl && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({
        type: "CACHE_MINI_APP",
        url: manifest.entryUrl,
      });
    }
  },

  async uninstall(id: string): Promise<void> {
    const entry = await RegistryStore.findById(id);
    if (!entry) return;

    if (
      entry.source === "remote" &&
      entry.manifest.entryUrl &&
      "serviceWorker" in navigator
    ) {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({
        type: "EVICT_MINI_APP",
        url: entry.manifest.entryUrl,
      });
    }

    await RegistryStore.remove(id);
  },

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    const entry = await RegistryStore.findById(id);
    if (!entry) return;
    entry.state = enabled ? "installed" : "disabled";
    await RegistryStore.upsert(entry);
  },
};
