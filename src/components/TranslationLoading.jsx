import React, { useEffect, useState } from 'react';
import { useTranslation } from '../context/TranslationContext';
import './TranslationLoading.css';
import { TranslatedText } from './TranslatedText';

export default function TranslationLoading() {
  const { isTranslating, language } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isTranslating) {
      setVisible(true);
      // auto-hide after 7s
      const timer = setTimeout(() => setVisible(false), 7000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isTranslating, language]);

  if (!visible) return null;

  return (
    <div className="translation-loading-overlay" role="status" aria-live="polite">
      <div className="translation-loading-box">
        <div className="translation-spinner" aria-hidden="true" />
        <div className="translation-loading-text">
          <TranslatedText>Translating site…</TranslatedText>
        </div>
      </div>
    </div>
  );
}
