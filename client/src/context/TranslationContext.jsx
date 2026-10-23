import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { translations } from "../utils/translations";

const TranslationContext = createContext(null);

export function TranslationProvider({ children }) {
  // Try to load from localStorage, default to English
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("vote_language") || "en";
  });

  // Save to localStorage when language changes
  useEffect(() => {
    localStorage.setItem("vote_language", language);
  }, [language]);

  const t = useCallback(
    (key, params = {}) => {
      let rawString =
        translations[language]?.[key] || translations["en"]?.[key] || key;

      // Simple interpolation for variables like {name}
      Object.keys(params).forEach((paramKey) => {
        rawString = rawString.replace(`{${paramKey}}`, params[paramKey]);
      });

      return rawString;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}

export default TranslationContext;
