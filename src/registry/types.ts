import type { MiniAppManifest } from "@/sdk/types";

export type InstallState = "installed" | "available" | "disabled";

export interface RegistryEntry {
  manifest: MiniAppManifest;
  source: "builtin" | "remote";
  sourceUrl?: string;
  state: InstallState;
  installedAt?: number;
  cachedVersion?: string;
}
