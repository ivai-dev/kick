import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { config } from "../kickoff/config";
import en from "./en.json";
import vi from "./vi.json";

export const resources = {
  en: { translation: en },
  vi: { translation: vi },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: config.lang in resources ? config.lang : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
