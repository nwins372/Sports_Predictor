import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import './TranslationLoading.css';
import { TranslatedText } from './TranslatedText';

export default function TranslationLoading() {
  const { isTranslating } = useTranslation();

  if (!isTranslating) return null;

  return (
    <div className="translation-loading-overlay" role="status" aria-live="polite">
      <div className="translation-loading-box">
        <div className="translation-spinner" aria-hidden="true" />
        <div className="translation-loading-text"><TranslatedText>Translating site — please wait...</TranslatedText></div>
      </div>
    </div>
  );
}
