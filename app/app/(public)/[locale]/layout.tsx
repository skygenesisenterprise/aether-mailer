import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { LocaleProvider } from "@/context/locale-context";
import { Locale } from "@/lib/locale";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    return null;
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleProvider initialLocale={locale as Locale}>
        <div className="min-h-screen flex flex-col">{children}</div>
      </LocaleProvider>
    </NextIntlClientProvider>
  );
}
