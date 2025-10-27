import React, { useState, useEffect } from "react";
import translationService from "../services/translationService";
import "./ArticleModal.css";

export default function ArticleModal({ article, userLanguage, isOpen, onClose }) {
  const [translatedContent, setTranslatedContent] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);

  useEffect(() => {
    if (isOpen && article && userLanguage !== 'en') {
      translateArticle();
    } else if (isOpen && article && userLanguage === 'en') {
      setTranslatedContent(article);
    }
  }, [isOpen, article, userLanguage]);

  const translateArticle = async () => {
    if (!article) return;

    setIsTranslating(true);
    setTranslationError(null);

    try {
      const translated = await translationService.translateArticle(article, userLanguage, 'en');
      setTranslatedContent(translated);
    } catch (error) {
      console.error("Article translation error:", error);
      setTranslationError("Failed to translate article. Showing original content.");
      setTranslatedContent(article);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !article) return null;

  return (
    <div className="article-modal-overlay" onClick={handleOverlayClick}>
      <div className="article-modal">
        <div className="article-modal-header">
          <h2 className="article-modal-title">
            {translatedContent?.title || article.title}
          </h2>
          <button className="article-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="article-modal-body">
          {isTranslating ? (
            <div className="article-modal-loading">
              <p>Translating article...</p>
            </div>
          ) : (
            <>
              {article.urlToImage && (
                <img
                  src={article.urlToImage}
                  alt={translatedContent?.title || article.title}
                  className="article-modal-image"
                />
              )}

              <div className="article-modal-content">
                <p className="article-modal-description">
                  {translatedContent?.description || article.description}
                </p>

                {translatedContent?.content && (
                  <div className="article-modal-full-content">
                    <h4>Full Article:</h4>
                    <p>{translatedContent.content}</p>
                  </div>
                )}

                {translationError && (
                  <div className="article-modal-error">
                    <p>{translationError}</p>
                  </div>
                )}

                {translatedContent?.translated && (
                  <div className="article-modal-translation-info">
                    <small>
                      Translated from English to {translationService.getLanguageName(userLanguage)}
                    </small>
                  </div>
                )}
              </div>

              <div className="article-modal-footer">
                <div className="article-modal-meta">
                  <small className="article-modal-date">
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </small>
                  {article.source?.name && (
                    <small className="article-modal-source">
                      Source: {article.source.name}
                    </small>
                  )}
                </div>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="article-modal-read-more"
                >
                  Read Full Article
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
