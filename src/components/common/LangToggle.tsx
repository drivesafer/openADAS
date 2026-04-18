import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type LangCode } from "@/i18n/languages";

export function LangToggle() {
  const { i18n } = useTranslation();

  const cycle = () => {
    const idx = SUPPORTED_LANGUAGES.indexOf(i18n.language as LangCode);
    const next = SUPPORTED_LANGUAGES[(idx + 1) % SUPPORTED_LANGUAGES.length]!;
    i18n.changeLanguage(next);
    localStorage.setItem("openadas_lang", next);
  };

  return (
    <button
      onClick={cycle}
      className="cursor-pointer rounded-full border border-border bg-white/60 px-3 py-2.5 text-sm font-semibold shadow-md dark:border-border-dark dark:bg-black/25"
    >
      {SUPPORTED_LANGUAGES.map((l) => l.toUpperCase()).join(" / ")}
    </button>
  );
}
