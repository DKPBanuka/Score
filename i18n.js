import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

import en from '../i18n/locales/en.json';
import si from '../i18n/locales/si.json';

const i18n = new I18n({ en, si });
i18n.enableFallback = true;

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
    const [locale, setLocaleState] = useState(Localization.getLocales()[0]?.languageTag.split('-')[0] || 'en');
    i18n.locale = locale;

    const setLocale = useCallback((newLocale) => {
        setLocaleState(newLocale);
        i18n.locale = newLocale;
    }, []);

    const t = useCallback((scope, options) => {
        return i18n.t(scope, { ...options, locale });
    }, [locale]);

    const value = useMemo(() => {
        return { locale, setLocale, t };
    }, [locale, setLocale, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (context === null) {
        throw new Error("useTranslation must be used within a LanguageProvider");
    }
    return context;
};