import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import translationService from '../services/translationService';

const TranslationContext = createContext();

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Try to get language from localStorage first
    const savedLang = localStorage.getItem('user_preferred_language');
    return savedLang || 'en';
  });

  const [translations, setTranslations] = useState(new Map());
  const [isTranslating, setIsTranslating] = useState(false);
  // Registry for page-level canonical strings to prefetch on language change
  const registeredStringsRef = useRef(new Set());
  // If true, provider will suppress showing the overlay for the next prefetch
  const suppressOverlayRef = useRef(false);

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

  // Switch language but suppress the overlay for the prefetch that follows.
  const setLanguageNoOverlay = useCallback((lang) => {
    suppressOverlayRef.current = true;
    setUserLanguage(lang);
  }, [setUserLanguage]);

  // Register an array of canonical strings for a page so the provider can prefetch
  const registerPageStrings = useCallback((strings = []) => {
    if (!Array.isArray(strings)) return () => {};
    strings.forEach(s => {
      if (typeof s === 'string' && s.trim()) registeredStringsRef.current.add(s);
    });

    // Return an unregister function for cleanup
    return () => {
      strings.forEach(s => registeredStringsRef.current.delete(s));
    };
  }, []);

  // When language changes, prefetch registered strings (if any) to avoid per-component floods
  useEffect(() => {
    let mounted = true;
    const doPrefetch = async () => {
      const toPrefetch = Array.from(registeredStringsRef.current || []);
      if (!toPrefetch.length || language === 'en') return;
      // If all requested translations are already in our cache, skip showing the overlay
      const allCached = translationService.areAllCached(toPrefetch, language, 'en');
      if (allCached) {
        // Populate provider translations from cache so UI updates instantly
        const populated = new Map(translations);
        for (const t of toPrefetch) {
          const cached = translationService.getCachedTranslation(t, language, 'en');
          if (cached) {
            const key = `${t}-${language}`;
            populated.set(key, cached);
          }
        }
        if (mounted) setTranslations(populated);
        // clear any suppression for next time
        suppressOverlayRef.current = false;
        return;
      }

      const suppress = !!suppressOverlayRef.current;
      try {
        if (!suppress) setIsTranslating(true);
        await translationService.prefetchTranslations(toPrefetch, language, 'en');
        // After prefetch, populate provider translations from cache
        const populated = new Map(translations);
        for (const t of toPrefetch) {
          const cached = translationService.getCachedTranslation(t, language, 'en');
          if (cached) {
            const key = `${t}-${language}`;
            populated.set(key, cached);
          }
        }
        if (mounted) setTranslations(populated);
      } catch (err) {
        console.error('Prefetch failed', err);
      } finally {
        // always clear suppression after prefetch attempt
        suppressOverlayRef.current = false;
        if (mounted && !suppress) setIsTranslating(false);
      }
    };

    doPrefetch();

    return () => { mounted = false; };
  }, [language]);

  // Subscribe to translationService queue changes so the provider reflects active queue state
  useEffect(() => {
    let cancelled = false;
    const unsubscribe = translationService.subscribeToQueue((len) => {
      if (cancelled) return;
      // If any items in the queue or the service is currently processing, show translating
      const active = len > 0 || translationService.isProcessing;
      setIsTranslating(active);
    });

    return () => { cancelled = true; unsubscribe(); };
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
      isTranslating,
      registerPageStrings,
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