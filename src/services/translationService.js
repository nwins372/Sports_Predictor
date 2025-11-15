// Translation service using MyMemory API (free, no CORS issues)
class TranslationService {
  constructor() {
    // Using MyMemory API (free tier, no CORS issues)
    this.baseURL = 'https://api.mymemory.translated.net/get';
    this.requestQueue = [];
    this.isProcessing = false;
    this.rateLimitDelay = 250; // 250 milliseconds between requests
    this.lastRequestTime = 0;
    this.translationCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    this.supportedLanguages = {
      'en': 'English',
      'es': 'Spanish', 
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'pl': 'Polish',
      'tr': 'Turkish',
      'he': 'Hebrew',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'uk': 'Ukrainian',
      'cs': 'Czech',
      'hu': 'Hungarian',
      'ro': 'Romanian',
      'bg': 'Bulgarian',
      'hr': 'Croatian',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'et': 'Estonian',
      'lv': 'Latvian',
      'lt': 'Lithuanian',
      'mt': 'Maltese',
      'ga': 'Irish',
      'cy': 'Welsh',
      'is': 'Icelandic',
      'mk': 'Macedonian',
      'sq': 'Albanian',
      'sr': 'Serbian',
      'bs': 'Bosnian',
      'me': 'Montenegrin'
    };
    
    // Cache for translations to avoid repeated API calls
    this.translationCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Get list of supported languages
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Get language name from code
  getLanguageName(code) {
    return this.supportedLanguages[code] || code;
  }

  // Check if language is supported
  isLanguageSupported(code) {
    return code in this.supportedLanguages;
  }

  // Generate cache key for translation
  getCacheKey(text, targetLang, sourceLang = 'auto') {
    return `${sourceLang}-${targetLang}-${this.hashText(text)}`;
  }

  // Simple hash function for cache keys
  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Check if cached translation is still valid
  isCacheValid(cacheKey) {
    const cached = this.translationCache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < this.cacheExpiry;
  }

  // Translate text using MyMemory API
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }

    try {
      const { text, targetLang, sourceLang, resolve, reject } = this.requestQueue.shift();
      const result = await this._translateText(text, targetLang, sourceLang);
      resolve(result);
    } catch (error) {
      const { reject } = this.requestQueue.shift();
      reject(error);
    } finally {
      this.lastRequestTime = Date.now();
      this.isProcessing = false;
      if (this.requestQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  async translateText(text, targetLang, sourceLang = 'en') {
    if (!text || !targetLang) {
      throw new Error('Text and target language are required');
    }

    // Handle non-string inputs
    if (typeof text !== 'string') {
      console.warn('Non-string text provided to translation service:', text);
      return text;
    }

    if (!this.isLanguageSupported(targetLang)) {
      throw new Error(`Target language ${targetLang} is not supported`);
    }

    // Queue the request
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ text, targetLang, sourceLang, resolve, reject });
      this.processQueue();
    });
  }

  async _translateText(text, targetLang, sourceLang = 'en') {
    console.log(`Translating: "${text.substring(0, 50)}..." from ${sourceLang} to ${targetLang}`);

    const cacheKey = this.getCacheKey(text, targetLang, sourceLang);
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      console.log('Using cached translation');
      return this.translationCache.get(cacheKey).translation;
    }

    try {
      const params = new URLSearchParams({
        q: text,
        langpair: `${sourceLang}|${targetLang}`
      });
      
      const response = await fetch(`${this.baseURL}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.responseData || !data.responseData.translatedText) {
        throw new Error('No translation returned from API');
      }

      const translatedText = data.responseData.translatedText;
      console.log(`Translation result: "${translatedText.substring(0, 50)}..."`);

      // Store in cache
      this.translationCache.set(cacheKey, {
        translation: translatedText,
        timestamp: Date.now()
      });

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      
      // Fallback: return original text if translation fails
      return text;
    }
  }

  // Translate an array of texts
  async translateMultiple(texts, targetLang, sourceLang = 'en') {
    if (!Array.isArray(texts)) {
      throw new Error('Texts must be an array');
    }

    const translations = await Promise.all(
      texts.map(text => this.translateText(text, targetLang, sourceLang))
    );

    return translations;
  }

  // Translate article object (title, description, content)
  async translateArticle(article, targetLang, sourceLang = 'en') {
    if (!article || typeof article !== 'object') {
      throw new Error('Article must be an object');
    }

    const translatedArticle = { ...article };

    try {
      // Translate title
      if (article.title) {
        translatedArticle.title = await this.translateText(article.title, targetLang, sourceLang);
      }

      // Translate description
      if (article.description) {
        translatedArticle.description = await this.translateText(article.description, targetLang, sourceLang);
      }

      // Translate content if available and substantial
      if (article.content && article.content.length > 50) {
        translatedArticle.content = await this.translateText(article.content, targetLang, sourceLang);
      } else if (article.content) {
        // Keep short content as-is
        translatedArticle.content = article.content;
      }

      // Add translation metadata
      translatedArticle.translated = true;
      translatedArticle.originalLanguage = sourceLang;
      translatedArticle.targetLanguage = targetLang;

      return translatedArticle;
    } catch (error) {
      console.error('Article translation error:', error);
      return article; // Return original article if translation fails
    }
  }

  // Translate multiple articles
  async translateArticles(articles, targetLang, sourceLang = 'en') {
    if (!Array.isArray(articles)) {
      throw new Error('Articles must be an array');
    }

    const translatedArticles = await Promise.all(
      articles.map(article => this.translateArticle(article, targetLang, sourceLang))
    );

    return translatedArticles;
  }

  // Clear translation cache
  clearCache() {
    this.translationCache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.translationCache.size,
      maxAge: this.cacheExpiry,
      languages: Object.keys(this.supportedLanguages).length
    };
  }
}

// Create singleton instance
const translationService = new TranslationService();

export default translationService;
