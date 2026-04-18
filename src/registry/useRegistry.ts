import { useEffect, useState, useCallback } from "react";
import { RegistryStore } from "./RegistryStore";
import { InstallManager } from "./InstallManager";
import { BUILTIN_MANIFESTS } from "./builtins";
import type { RegistryEntry } from "./types";

export function useRegistry() {
  const [entries, setEntries] = useState<RegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const all = await RegistryStore.getAll();
    setEntries(all);
  }, []);

  useEffect(() => {
    (async () => {
      await InstallManager.seedBuiltins(BUILTIN_MANIFESTS);
      await reload();
      setLoading(false);
    })();
  }, [reload]);

  const installed = entries.filter((e) => e.state === "installed");
  const available = entries.filter((e) => e.state === "available");

  return { entries, installed, available, loading, reload };
}
