export const LANG = {
  VI: "vi",
  EN: "en",
} as const;

export type LangCode = (typeof LANG)[keyof typeof LANG];

export const SUPPORTED_LANGUAGES: LangCode[] = Object.values(LANG);
export const DEFAULT_LANG: LangCode = LANG.EN;

export function detectLanguage(): LangCode {
  const stored = localStorage.getItem("openadas_lang") as LangCode | null;
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
  const browserLang = navigator.language.split("-")[0];
  return SUPPORTED_LANGUAGES.includes(browserLang as LangCode)
    ? (browserLang as LangCode)
    : DEFAULT_LANG;
}
