import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import './LanguageSelector.css';

export function LanguageSelector() {
  const { language, setLanguage, getSupportedLanguages, getCurrentLanguageName } = useTranslation();
  const languages = getSupportedLanguages();

  return (
    <div className="language-selector">
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value)}
        aria-label="Select language"
      >
        {Object.entries(languages).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}