import { useTranslation } from "react-i18next";
import type { MiniAppManifest } from "@/sdk/types";
import type { LangCode } from "@/i18n/languages";

interface Props {
  manifest: MiniAppManifest;
  installed: boolean;
  onLaunch: () => void;
  onInstall?: () => void;
  onUninstall?: () => void;
}

export function AppCard({ manifest, installed, onLaunch, onInstall, onUninstall }: Props) {
  const { i18n } = useTranslation();
  const lang = i18n.language as LangCode;
  const name = manifest.name[lang] ?? manifest.name.en;
  const desc = manifest.description[lang] ?? manifest.description.en;

  return (
    <div className="rounded-2xl border border-border bg-white/85 p-4 shadow-[0_10px_22px_rgba(0,0,0,.08)] dark:border-border-dark dark:bg-white/4">
      <div className="flex gap-3.5">
        <div
          className="mt-1 h-[46px] w-1.5 rounded-full"
          style={{ background: manifest.accentColor }}
        />
        <div className="text-[30px] leading-none">{manifest.icon}</div>
        <div className="flex-1">
          <p className="m-0 text-lg font-bold">{name}</p>
          <p className="m-0 mt-2 text-sm text-muted dark:text-muted-dark">{desc}</p>
          <div className="mt-3 flex gap-2">
            {installed ? (
              <>
                <button
                  onClick={onLaunch}
                  className="rounded-lg bg-accent-blue px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Launch
                </button>
                {onUninstall && manifest.entryUrl && (
                  <button
                    onClick={onUninstall}
                    className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400"
                  >
                    Remove
                  </button>
                )}
              </>
            ) : (
              onInstall && (
                <button
                  onClick={onInstall}
                  className="rounded-lg bg-accent-green px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Install
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
