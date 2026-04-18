import { useTranslation, Trans } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useRegistry } from "@/registry/useRegistry";
import { AppShell } from "@/components/layout/AppShell";
import { SafeArea } from "@/components/layout/SafeArea";
import { LangToggle } from "@/components/common/LangToggle";
import { AppCard } from "@/components/marketplace/AppCard";
import { AppGrid } from "@/components/marketplace/AppGrid";
import type { LangCode } from "@/i18n/languages";

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { installed, loading } = useRegistry();
  const lang = i18n.language as LangCode;

  return (
    <AppShell>
      <SafeArea>
        <div className="mx-auto max-w-[980px] p-4.5">
          <header className="mb-2.5 flex items-start justify-between gap-3.5">
            <h1 className="m-0 text-[22px] font-bold tracking-tight md:text-[28px]">
              OpenADAS
            </h1>
            <LangToggle />
          </header>

          <section className="mt-2.5 rounded-2xl border border-border bg-white/80 p-3.5 text-base text-muted shadow-[0_10px_22px_rgba(0,0,0,.08)] dark:border-border-dark dark:bg-white/4 dark:text-muted-dark">
            <Trans i18nKey="intro" components={{ strong: <strong className="text-text dark:text-text-dark" /> }} />
          </section>

          {loading ? (
            <div className="mt-8 text-center text-muted dark:text-muted-dark">Loading...</div>
          ) : (
            <AppGrid>
              {installed.map((entry) => (
                <AppCard
                  key={entry.manifest.id}
                  manifest={entry.manifest}
                  installed
                  onLaunch={() => navigate(`/app/${entry.manifest.id}`)}
                />
              ))}
            </AppGrid>
          )}

          <div className="mt-4 text-center">
            <Link
              to="/marketplace"
              className="text-sm font-semibold text-accent-blue underline decoration-accent-blue/30"
            >
              {t("browse_marketplace")}
            </Link>
          </div>

          <footer className="mt-5 flex flex-col gap-2.5 border-t border-border pt-4 text-sm text-muted dark:border-border-dark dark:text-muted-dark">
            <div>
              <a href="https://github.com/drivesafer/openADAS/" className="font-semibold text-inherit">
                GitHub
              </a>
              {" · "}
              <a href="https://github.com/drivesafer/openADAS/issues" className="font-semibold text-inherit">
                {t("issue")}
              </a>
            </div>
            <div className="font-bold text-text dark:text-text-dark">{t("safe")}</div>
          </footer>
        </div>
      </SafeArea>
    </AppShell>
  );
}
