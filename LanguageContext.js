import React, { createContext, useState, useContext, useMemo } from 'react';
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

import en from '../i18n/locales/en.json';
import si from '../i18n/locales/si.json';

// Create i18n instance
const i18n = new I18n({
  en,
  si,
});

i18n.enableFallback = true;
i18n.defaultLocale = "en";

// Create Context
const LanguageContext = createContext();

// Create Provider Component
export const LanguageProvider = ({ children }) => {
    const [locale, setLocaleState] = useState(Localization.getLocales()[0]?.languageTag.split('-')[0] || 'en');
    
    const languageContext = useMemo(() => ({
        locale,
        setLocale: (newLocale) => {
            i18n.locale = newLocale;
            setLocaleState(newLocale);
        },
        t: (scope, options) => i18n.t(scope, { ...options, locale }),
    }), [locale]);

    return (
        <LanguageContext.Provider value={languageContext}>
            {children}
        </LanguageContext.Provider>
    );
};

// Custom Hook to use the context
export const useTranslation = () => useContext(LanguageContext);