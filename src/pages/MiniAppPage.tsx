import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RegistryStore } from "@/registry/RegistryStore";
import { RemoteLoader } from "@/registry/RemoteLoader";
import { MiniAppHost } from "@/components/host/MiniAppHost";
import type { MiniAppLifecycle } from "@/sdk/types";

const BUILTIN_LOADERS: Record<string, () => Promise<{ default: MiniAppLifecycle }>> = {
  "traffic-sign": () => import("@/mini-apps/traffic-sign"),
  "traffic-sign-tune": () => import("@/mini-apps/traffic-sign-tune"),
  "lane-departure": () => import("@/mini-apps/lane-departure"),
  "combo": () => import("@/mini-apps/combo"),
};

export default function MiniAppPage() {
  const { appId } = useParams<{ appId: string }>();
  const { t } = useTranslation();
  const [lifecycle, setLifecycle] = useState<MiniAppLifecycle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appId) return;
    let cancelled = false;

    (async () => {
      try {
        const entry = await RegistryStore.findById(appId);
        if (!entry) {
          setError(`App "${appId}" not found in registry.`);
          return;
        }

        let lc: MiniAppLifecycle;
        const builtinLoader = BUILTIN_LOADERS[appId];
        if (builtinLoader) {
          const mod = await builtinLoader();
          lc = mod.default;
        } else if (entry.manifest.entryUrl) {
          lc = await RemoteLoader.loadModule(entry.manifest.entryUrl);
        } else {
          setError(`No loader available for "${appId}".`);
          return;
        }

        if (!cancelled) setLifecycle(lc);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      }
    })();

    return () => { cancelled = true; };
  }, [appId]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-surface text-text dark:bg-surface-dark dark:text-text-dark">
        <p className="text-red-400">{error}</p>
        <Link to="/" className="text-sm font-semibold text-accent-blue">
          ← {t("back")}
        </Link>
      </div>
    );
  }

  if (!lifecycle) {
    return (
      <div className="flex h-screen items-center justify-center bg-driving-bg text-white">
        Loading...
      </div>
    );
  }

  return <MiniAppHost lifecycle={lifecycle} />;
}
