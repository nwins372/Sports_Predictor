import React, { useEffect, useState } from 'react';
import { useTranslation } from '../context/TranslationContext';
import './LanguageSelector.css';

export function LanguageSelector() {
  const { language, setLanguage, getSupportedLanguages, getCurrentLanguageName, isTranslating, setLanguageNoOverlay } = useTranslation();
  const [storedLang, setStoredLang] = useState(null);

  useEffect(() => {
    // loadLanguagePreference: check localStorage for a stored preference
    try {
      const localLanguage = localStorage.getItem('user_preferred_language');
      if (localLanguage) {
        setStoredLang(localLanguage);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // If there's no stored language, or it's English, hide the toggle
  if (!storedLang || storedLang === 'en') return null;

  const supported = getSupportedLanguages ? getSupportedLanguages() : {};
  const storedLabel = supported[storedLang] || storedLang.toUpperCase();

  const toggle = () => {
    try {
      if (language === 'en') {
        setLanguageNoOverlay ? setLanguageNoOverlay(storedLang) : setLanguage(storedLang);
      } else {
        setLanguageNoOverlay ? setLanguageNoOverlay('en') : setLanguage('en');
      }
    } catch (e) {
      console.warn('Language toggle failed', e);
    }
  };

  return (
    <div className="language-selector">
      <button
        type="button"
        className={`lang-toggle-btn ${isTranslating ? 'disabled' : ''}`}
        onClick={toggle}
        aria-pressed={language !== 'en'}
        title={isTranslating ? 'Translating site...' : (language === 'en' ? `Switch to ${storedLabel}` : `Switch to English`) }
        disabled={isTranslating}
      >
        {isTranslating ? 'Translating...' : (language === 'en' ? storedLabel : 'EN')}
      </button>
    </div>
  );
}

export default LanguageSelector;