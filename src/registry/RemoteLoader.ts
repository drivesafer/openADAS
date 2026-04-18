import type { MiniAppManifest, MiniAppLifecycle } from "@/sdk/types";

export const RemoteLoader = {
  async fetchManifest(url: string): Promise<MiniAppManifest> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);
    const data = await res.json();
    if (!data.id || !data.name?.en || !data.version) {
      throw new Error("Invalid mini app manifest: missing required fields");
    }
    return data as MiniAppManifest;
  },

  async loadModule(entryUrl: string): Promise<MiniAppLifecycle> {
    const mod = await import(/* @vite-ignore */ entryUrl);
    const lifecycle = mod.default ?? mod;
    if (typeof lifecycle.mount !== "function" || typeof lifecycle.unmount !== "function") {
      throw new Error("Remote module must export mount() and unmount()");
    }
    return lifecycle as MiniAppLifecycle;
  },
};
