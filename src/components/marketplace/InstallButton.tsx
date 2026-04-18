import { useTranslation } from "react-i18next";

interface Props {
  installed: boolean;
  onInstall: () => void;
  onUninstall: () => void;
}

export function InstallButton({ installed, onInstall, onUninstall }: Props) {
  const { t } = useTranslation();

  return installed ? (
    <button
      onClick={onUninstall}
      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400"
    >
      {t("uninstall")}
    </button>
  ) : (
    <button
      onClick={onInstall}
      className="rounded-lg bg-accent-green px-3 py-1.5 text-xs font-semibold text-white"
    >
      {t("install")}
    </button>
  );
}
