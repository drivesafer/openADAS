import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useRegistry } from "@/registry/useRegistry";
import { InstallManager } from "@/registry/InstallManager";
import { RemoteLoader } from "@/registry/RemoteLoader";
import { AppShell } from "@/components/layout/AppShell";
import { SafeArea } from "@/components/layout/SafeArea";
import { AppCard } from "@/components/marketplace/AppCard";
import { AppGrid } from "@/components/marketplace/AppGrid";

export default function MarketplacePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { entries, reload, loading } = useRegistry();
  const [remoteUrl, setRemoteUrl] = useState("");
  const [error, setError] = useState("");

  const handleAddRemote = async () => {
    setError("");
    try {
      const manifest = await RemoteLoader.fetchManifest(remoteUrl.trim());
      await InstallManager.installRemote(manifest, remoteUrl.trim());
      setRemoteUrl("");
      await reload();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUninstall = async (id: string) => {
    await InstallManager.uninstall(id);
    await reload();
  };

  return (
    <AppShell>
      <SafeArea>
        <div className="mx-auto max-w-[980px] p-4.5">
          <div className="mb-4 flex items-center gap-3">
            <Link
              to="/"
              className="text-sm font-semibold text-accent-blue"
            >
              ← {t("back")}
            </Link>
            <h1 className="m-0 text-xl font-bold">{t("marketplace")}</h1>
          </div>

          <section className="mb-6 rounded-xl border border-border p-4 dark:border-border-dark">
            <h3 className="mb-2 text-sm font-bold">{t("add_remote_url")}</h3>
            <div className="flex gap-2">
              <input
                type="url"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                placeholder="https://example.com/manifest.json"
                className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm dark:border-border-dark"
              />
              <button
                onClick={handleAddRemote}
                disabled={!remoteUrl.trim()}
                className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t("add")}
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          </section>

          {loading ? (
            <div className="text-center text-muted dark:text-muted-dark">Loading...</div>
          ) : (
            <AppGrid>
              {entries.map((entry) => (
                <AppCard
                  key={entry.manifest.id}
                  manifest={entry.manifest}
                  installed={entry.state === "installed"}
                  onLaunch={() => navigate(`/app/${entry.manifest.id}`)}
                  onUninstall={
                    entry.source === "remote"
                      ? () => handleUninstall(entry.manifest.id)
                      : undefined
                  }
                />
              ))}
            </AppGrid>
          )}
        </div>
      </SafeArea>
    </AppShell>
  );
}
