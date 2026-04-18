import i18next from "i18next";
import {
  LANG,
  SUPPORTED_LANGUAGES,
  detectLanguage,
  type LangCode,
} from "@/i18n/languages";

export const I18nService = {
  LANG,
  supportedLanguages: SUPPORTED_LANGUAGES,

  get language(): LangCode {
    return i18next.language as LangCode;
  },

  t(key: string, options?: Record<string, unknown>): string {
    return String(i18next.t(key, options as any));
  },

  async changeLanguage(lang: LangCode): Promise<void> {
    await i18next.changeLanguage(lang);
    localStorage.setItem("openadas_lang", lang);
  },

  detectLanguage,
};
