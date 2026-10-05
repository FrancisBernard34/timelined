"use client";

import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/routing";
import { routing, type Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span className="sr-only">{t("label")}</span>
      <select
        aria-label={t("label")}
        value={locale}
        onChange={(event) =>
          router.replace(pathname, { locale: event.target.value as Locale })
        }
        className="px-2 py-1.5 rounded-md border border-border bg-input text-foreground text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {routing.locales.map((option) => (
          <option key={option} value={option}>
            {option === "pt-br" ? "PT" : option.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
