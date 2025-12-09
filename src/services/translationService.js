// Translation service using MyMemory API (free, no CORS issues)
class TranslationService {
  constructor() {
    // Using MyMemory API (free tier, no CORS issues)
    this.baseURL = 'https://api.mymemory.translated.net/get';
    this.requestQueue = [];
    this.isProcessing = false;
    this.rateLimitDelay = 1; // 1 millisecond between requests
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
    this.localStorageKey = 'translationCache_v1';

    // Queue subscribers will be notified when the requestQueue length changes
    this.queueSubscribers = new Set();
    // Request timeout (ms) to avoid indefinitely hanging fetches
    // MyMemory API typically responds in 500ms-2000ms; set higher to avoid false timeouts
    this.requestTimeout = 10000; // 10 seconds

    // Load cache from localStorage on startup (with safety timeout to prevent infinite loops)
    try {
      this.loadCacheFromLocalStorage();
    } catch (e) {
      console.error('Error loading cache from localStorage during initialization', e);
      // Clear corrupted cache if loading fails
      try {
        localStorage.removeItem(this.localStorageKey);
      } catch (_) {}
    }
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

    // Pull one request from the queue and process it. Use a local reference so we
    // always resolve/reject the correct promise even if errors occur.
    const req = this.requestQueue.shift();
    // notify subscribers that queue length changed
    this._notifyQueueChange();

    try {
      if (!req) return;
      const { text, targetLang, sourceLang, resolve, reject } = req;
      const result = await this._translateText(text, targetLang, sourceLang);
      try { resolve(result); } catch (e) { /* ignore resolution errors */ }
    } catch (error) {
      try {
        if (req && req.reject) req.reject(error);
      } catch (e) {
        console.warn('Error rejecting translation promise', e);
      }
    } finally {
      this.lastRequestTime = Date.now();
      this.isProcessing = false;
      // notify subscribers again in case state changed
      this._notifyQueueChange();
      if (this.requestQueue.length > 0) {
        // Process next item asynchronously
        setTimeout(() => this.processQueue(), 0);
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
      this._notifyQueueChange();
      this.processQueue();
    });
  }

  // Notify subscribers with current queue length
  _notifyQueueChange() {
    const len = this.requestQueue.length;
    for (const cb of Array.from(this.queueSubscribers)) {
      try { cb(len); } catch (e) { console.warn('queue subscriber error', e); }
    }
  }

  // Subscribe to queue length changes. Returns unsubscribe function.
  subscribeToQueue(cb) {
    if (typeof cb !== 'function') return () => {};
    this.queueSubscribers.add(cb);
    // send initial value
    try { cb(this.requestQueue.length); } catch (e) {}
    return () => { this.queueSubscribers.delete(cb); };
  }

  // Get current queue length
  getQueueLength() {
    return this.requestQueue.length;
  }

  async _translateText(text, targetLang, sourceLang = 'en') {
    console.log(`Translating: "${text.substring(0, 50)}..." from ${sourceLang} to ${targetLang}`);

    const cacheKey = this.getCacheKey(text, targetLang, sourceLang);

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      console.log('Using cached translation');
      return this.translationCache.get(cacheKey).translation;
    }

    const params = new URLSearchParams({
      q: text,
      langpair: `${sourceLang}|${targetLang}`
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(`${this.baseURL}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
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

      // Store in cache and persist to localStorage
      this.translationCache.set(cacheKey, {
        translation: translatedText,
        timestamp: Date.now()
      });
      this.saveCacheToLocalStorage();

      return translatedText;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Translation request timed out');
      } else {
        console.error('Translation error:', error);
      }
      // Fallback: return original text if translation fails
      return text;
    } finally {
      clearTimeout(timeoutId);
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

  // Prefetch translations for an array of texts. Returns a promise that resolves when all
  // requested translations have been queued/completed. This uses translateMultiple which
  // itself queues requests and respects the service's rate limiting.
  async prefetchTranslations(texts, targetLang, sourceLang = 'en') {
    if (!Array.isArray(texts) || texts.length === 0) return [];

    // Only attempt to translate string entries and dedupe
    const uniqueTexts = Array.from(new Set(texts.filter(t => typeof t === 'string' && t.trim())));
    try {
      const results = await this.translateMultiple(uniqueTexts, targetLang, sourceLang);
      return results;
    } catch (err) {
      console.error('Prefetch translations failed', err);
      // Resolve with empty array on failure to avoid breaking callers
      return uniqueTexts.map(t => t);
    }
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

  // Return cached translation or null
  getCachedTranslation(text, targetLang, sourceLang = 'en') {
    try {
      const cacheKey = this.getCacheKey(text, targetLang, sourceLang);
      if (this.isCacheValid(cacheKey)) {
        return this.translationCache.get(cacheKey).translation;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Return true if every text in the array has a valid cache entry for targetLang
  areAllCached(texts = [], targetLang, sourceLang = 'en') {
    if (!Array.isArray(texts) || texts.length === 0) return true;
    for (const t of texts) {
      if (typeof t !== 'string' || !t.trim()) continue;
      const cacheKey = this.getCacheKey(t, targetLang, sourceLang);
      if (!this.isCacheValid(cacheKey)) return false;
    }
    return true;
  }

  // Save cache to localStorage (debounced via caller if needed)
  saveCacheToLocalStorage() {
    try {
      const cacheData = {};
      for (const [key, value] of this.translationCache.entries()) {
        cacheData[key] = value;
      }
      localStorage.setItem(this.localStorageKey, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('Failed to save translation cache to localStorage', e);
    }
  }

  // Load cache from localStorage
  loadCacheFromLocalStorage() {
    try {
      const cached = localStorage.getItem(this.localStorageKey);
      if (!cached) return;
      
      const cacheData = JSON.parse(cached);
      if (typeof cacheData !== 'object' || cacheData === null) {
        console.warn('Cache data is not a valid object, skipping load');
        return;
      }

      let loadedCount = 0;
      const entries = Object.entries(cacheData);
      
      // Limit iterations to prevent infinite loops; process max 1000 entries
      const maxEntries = Math.min(entries.length, 1000);
      for (let i = 0; i < maxEntries; i++) {
        const [key, value] = entries[i];
        
        // Validate entry structure
        if (!key || typeof key !== 'string') continue;
        if (!value || typeof value !== 'object') continue;
        if (typeof value.translation !== 'string') continue;
        if (typeof value.timestamp !== 'number') continue;
        
        // Check if entry is still fresh
        const age = Date.now() - value.timestamp;
        if (age >= this.cacheExpiry) continue; // Skip expired entries
        
        this.translationCache.set(key, value);
        loadedCount++;
      }
      
      if (loadedCount > 0) {
        console.log(`Loaded ${loadedCount} translations from cache`);
      }
    } catch (e) {
      console.warn('Failed to load translation cache from localStorage', e);
      // Don't throw; allow app to continue
    }
  }
}

// Create singleton instance
const translationService = new TranslationService();

export default translationService;
