import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../context/TranslationContext';

// Keep track of pending translations to avoid duplicates
const pendingTranslations = new Map();
const translationBatch = new Set();
let batchTimeout = null;

const processBatch = async () => {
  const batch = Array.from(translationBatch);
  translationBatch.clear();
  
  for (const { text, translate, callback } of batch) {
    try {
      if (!pendingTranslations.has(text)) {
        pendingTranslations.set(text, translate(text));
      }
      const translation = await pendingTranslations.get(text);
      callback(translation);
    } catch (error) {
      console.error('Translation error:', error);
      callback(text); // Fallback to original text on error
    } finally {
      pendingTranslations.delete(text);
    }
  }
};

export function TranslatedText({ children }) {
  const { translate } = useTranslation();
  const [translatedText, setTranslatedText] = useState(children);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (children && typeof children === 'string') {
      // Add to batch
      translationBatch.add({
        text: children,
        translate,
        callback: (text) => {
          if (mounted.current) {
            setTranslatedText(text);
          }
        }
      });

      // Schedule batch processing
      if (batchTimeout) {
        clearTimeout(batchTimeout);
      }
      batchTimeout = setTimeout(processBatch, 100); // Process batch every 100ms
    }
  }, [children, translate]);

  // If children is not a string, return it as is
  if (typeof children !== 'string') {
    return children;
  }

  return translatedText;
}