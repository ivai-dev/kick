import { format } from "date-fns";
import { enUS, vi } from "date-fns/locale";

import { config } from "../kickoff/config";

const dateLocale = config.lang === "vi" ? vi : enUS;

export function formatDate(iso: string): string {
  return format(new Date(iso), "P", { locale: dateLocale });
}

const money = new Intl.NumberFormat(config.locale, {
  style: "currency",
  currency: config.locale === "vi-VN" ? "VND" : "USD",
  maximumFractionDigits: 0,
});

export function formatMoney(value: number): string {
  return money.format(value);
}
