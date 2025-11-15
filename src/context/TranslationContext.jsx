import React, { createContext, useContext, useState, useCallback } from 'react';
import translationService from '../services/translationService';

const TranslationContext = createContext();

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Try to get language from localStorage first
    const savedLang = localStorage.getItem('user_preferred_language');
    return savedLang || 'en';
  });

  const [translations, setTranslations] = useState(new Map());

  const translate = useCallback(async (text) => {
    if (language === 'en') return text; // Don't translate if target is English
    
    // Check if we already have this translation in state
    const key = `${text}-${language}`;
    if (translations.has(key)) {
      return translations.get(key);
    }

    try {
      const translated = await translationService.translateText(text, language, 'en');
      // Store the translation in state
      setTranslations(prev => new Map(prev).set(key, translated));
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original text
    }
  }, [language, translations]);

  const setUserLanguage = useCallback((lang) => {
    if (!translationService.isLanguageSupported(lang)) {
      console.warn(`Language ${lang} is not supported`);
      return;
    }
    setLanguage(lang);
    localStorage.setItem('user_preferred_language', lang);
    // Clear translations when language changes
    setTranslations(new Map());
  }, []);

  // Get list of supported languages
  const getSupportedLanguages = useCallback(() => {
    return translationService.getSupportedLanguages();
  }, []);

  // Get current language name
  const getCurrentLanguageName = useCallback(() => {
    return translationService.getLanguageName(language);
  }, [language]);

  return (
    <TranslationContext.Provider value={{
      language,
      setLanguage: setUserLanguage,
      translate,
      getSupportedLanguages,
      getCurrentLanguageName
    }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}