import React, { useEffect, useMemo, useState } from "react";
import "./SportsNewsPage.css";
import ScheduleBar from "../components/ScheduleBar";
import { supabase } from "../supabaseClient";
import translationService from "../services/translationService";
import { useTranslation } from '../context/TranslationContext';
import ArticleModal from "../components/ArticleModal";
import Transactions from "./Transactions";
import { TranslatedText } from "../components/TranslatedText";

const pageStrings = [
  'Sports News',
  'Refresh',
  'Refreshing…',
  'Translating…',
  'By Preferences',
  'All Articles',
  'Loading latest sports news...',
  'Translating news...',
  'No news available. Try again later.',
  'Read Translated',
  'Auto Translate',
  'Read Original'
];

const API_KEY = "f9f8b0829ca84fe1a1d450e0fe7dbbd1";
const API_URL = `https://newsapi.org/v2/top-headlines?category=sports&language=en&pageSize=20&apiKey=${API_KEY}`;
const TOP_HEADLINES_BASE = "https://newsapi.org/v2/top-headlines";

function SportsNewsPage() {
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState([]); // ["NFL","NBA",...] from Supabase
  const [userLanguage, setUserLanguage] = useState('en');
  const [translatedNews, setTranslatedNews] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterMode, setFilterMode] = useState(() => {
    try { return localStorage.getItem('newsFilterMode') || 'preferences'; } catch (_) { return 'preferences'; }
  });

  // Lowercase keyword map for basic matching
  const keywordMap = useMemo(() => ({
    NFL: [
      "nfl", "american football", "super bowl", "quarterback", "qb", "touchdown",
      "nfc", "afc", "patriots", "cowboys", "eagles", "chiefs", "ravens", "broncos"
    ],
    NBA: [
      "nba", "basketball", "playoffs", "finals", "lebron", "curry", "lakers", "celtics",
      "warriors", "bucks", "nuggets"
    ],
    MLB: [
      "mlb", "baseball", "home run", "pitcher", "yankees", "dodgers", "red sox",
      "mets", "braves", "world series"
    ],
    "College Sports": [
      "college football", "ncaa football", "cfp", "college football playoff", "heisman",
      "alabama", "georgia", "ohio state", "michigan", "clemson", "notre dame",
      "sec", "big ten", "acc", "pac-12", "big 12", "college basketball", "ncaa basketball", 
      "march madness", "final four", "duke", "kentucky", "north carolina", "kansas", "villanova",
      "acc basketball", "big east", "big ten basketball", "college baseball", "ncaa baseball", 
      "college world series", "omaha", "vanderbilt", "florida", "arkansas", "mississippi state", 
      "lsu", "sec baseball", "acc baseball", "big 12 baseball"
    ],
  }), []);

  // Build sport-specific NewsAPI query strings to increase volume per league
  const sportQueryMap = useMemo(() => ({
    NFL: "(NFL OR \"National Football League\" OR quarterback OR touchdown)",
    NBA: "(NBA OR \"National Basketball Association\" OR basketball)",
    MLB: "(MLB OR \"Major League Baseball\" OR baseball)",
    "College Sports": "(\"college football\" OR \"NCAA football\" OR \"College Football Playoff\" OR Heisman OR \"college basketball\" OR \"NCAA basketball\" OR \"March Madness\" OR \"Final Four\" OR \"college baseball\" OR \"NCAA baseball\" OR \"College World Series\")",
  }), []);

  const { registerPageStrings } = useTranslation();

  useEffect(() => {
    const unregister = registerPageStrings(pageStrings);
    return () => unregister();
  }, [registerPageStrings]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      // 1) Get session and user preferences
      let selectedPrefs = [];
      let userLang = 'en';
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;
        if (session?.user?.id) {
          const { data, error } = await supabase
            .from("user_preferences")
            .select("sports_prefs, preferred_language")
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (!error) {
            if (Array.isArray(data?.sports_prefs)) {
              selectedPrefs = data.sports_prefs;
            }
            if (data?.preferred_language) {
              userLang = data.preferred_language;
              console.log("Using database language:", userLang);
            }
          }
          
          // Always check localStorage as fallback, regardless of database result
          const localLanguage = localStorage.getItem('user_preferred_language');
          console.log("Checking localStorage fallback:", localLanguage);
          if (localLanguage && (!data?.preferred_language || data.preferred_language === 'en')) {
            userLang = localLanguage;
            console.log("Using localStorage language:", userLang);
          }
        }
      } catch (e) {
        // Non-fatal: fall back to localStorage
        const localLanguage = localStorage.getItem('user_preferred_language');
        console.log("localStorage language preference:", localLanguage);
        if (localLanguage) {
          userLang = localLanguage;
        }
      }
      console.log("Final user language set to:", userLang);
      setPrefs(selectedPrefs);
      setUserLanguage(userLang);

      // 2) Try to use preference-aware cache
  const cacheKey = `sportsNews:${filterMode}:${selectedPrefs && selectedPrefs.length ? selectedPrefs.slice().sort().join("-") : "all"}`;
  const tsKey = `${cacheKey}:ts`;
      const cached = localStorage.getItem(cacheKey);
      const lastUpdate = localStorage.getItem(tsKey);
      const now = new Date().getTime();
      if (cached && lastUpdate && now - Number(lastUpdate) < 24 * 60 * 60 * 1000) {
        try {
          const parsed = JSON.parse(cached);
          setTranslatedNews(parsed);
          setLoading(false);
          return;
        } catch (_) {
          // continue to fetch
        }
      }

      // 3) Fetch and filter (fetch more by querying per-sport when known)
      try {
        let articles = [];

        const targetSports = (selectedPrefs && selectedPrefs.length ? selectedPrefs : ["NFL", "NBA", "MLB", "College Sports"]) // default to the big three plus college
          .filter((s) => sportQueryMap[s]);

        if (targetSports.length > 0) {
          // Query per-sport with larger pageSize and merge
          const requests = targetSports.map((sport) => {
            const q = encodeURIComponent(sportQueryMap[sport]);
            const url = `${TOP_HEADLINES_BASE}?language=en&pageSize=50&q=${q}&apiKey=${API_KEY}`;
            return fetch(url).then((r) => r.json()).catch(() => ({ articles: [] }));
          });
          const results = await Promise.all(requests);
          articles = results.flatMap((res) => Array.isArray(res?.articles) ? res.articles : []);
        }

        // Fallback to generic call if nothing returned
        if (!articles || articles.length === 0) {
          const response = await fetch(API_URL);
          const data = await response.json();
          articles = Array.isArray(data?.articles) ? data.articles : [];
        }

        // Dedupe by URL
        const seen = new Set();
        const deduped = [];
        for (const a of articles) {
          const key = a?.url || `${a?.title}-${a?.publishedAt}`;
          if (key && !seen.has(key)) { seen.add(key); deduped.push(a); }
        }

        const filtered = filterArticlesByPreferences(deduped, selectedPrefs, keywordMap);

        // Translate news if user language is not English
        console.log("User language:", userLang, "Filtered articles count:", filtered.length);
        if (userLang !== 'en') {
          setIsTranslating(true);
          console.log("Starting translation to:", userLang);
          try {
            const translated = await translationService.translateArticles(filtered, userLang, 'en');
            console.log("Translation completed:", translated.length, "articles");
            setTranslatedNews(translated);
          } catch (error) {
            console.error("Translation error:", error);
            setTranslatedNews(filtered); // Fallback to original
          } finally {
            setIsTranslating(false);
          }
        } else {
          console.log("No translation needed, language is English");
          setTranslatedNews(filtered);
        }
        const resultArticles = filterMode === 'all'
          ? deduped
          : filterArticlesByPreferences(deduped, selectedPrefs, keywordMap);
        localStorage.setItem(cacheKey, JSON.stringify(resultArticles));
        localStorage.setItem(tsKey, now.toString());
      } catch (error) {
        console.error("Error fetching sports news:", error);
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMode]);

  function filterArticlesByPreferences(articles, selectedPrefs, map) {
    if (!Array.isArray(articles) || articles.length === 0) return [];
    if (!selectedPrefs || selectedPrefs.length === 0) return articles; // No preferences -> show all

    const selected = selectedPrefs.filter((s) => map[s]);
    if (selected.length === 0) return articles;

    return articles.filter((a) => {
      const hay = `${a?.title || ""} ${a?.description || ""} ${a?.content || ""}`.toLowerCase();
      return selected.some((sport) => map[sport].some((kw) => hay.includes(kw)));
    });
  }

  async function handleRefresh() {
    setLoading(true);
    try {
      const selectedPrefs = Array.isArray(prefs) ? prefs : [];
      const cacheKey = `sportsNews:${filterMode}:${selectedPrefs && selectedPrefs.length ? selectedPrefs.slice().sort().join("-") : "all"}`;
      const tsKey = `${cacheKey}:ts`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(tsKey);

      // On refresh, use the same expanded per-sport querying as initial load
      let articles = [];
      const targetSports = (selectedPrefs && selectedPrefs.length ? selectedPrefs : ["NFL", "NBA", "MLB", "College Sports"]) // default to the big three plus college
        .filter((s) => sportQueryMap[s]);

      if (targetSports.length > 0) {
        const requests = targetSports.map((sport) => {
          const q = encodeURIComponent(sportQueryMap[sport]);
          const url = `${TOP_HEADLINES_BASE}?language=en&pageSize=50&q=${q}&apiKey=${API_KEY}`;
          return fetch(url).then((r) => r.json()).catch(() => ({ articles: [] }));
        });
        const results = await Promise.all(requests);
        articles = results.flatMap((res) => Array.isArray(res?.articles) ? res.articles : []);
      }

      if (!articles || articles.length === 0) {
        const response = await fetch(API_URL);
        const data = await response.json();
        articles = Array.isArray(data?.articles) ? data.articles : [];
      }

      const seen = new Set();
      const deduped = [];
      for (const a of articles) {
        const key = a?.url || `${a?.title}-${a?.publishedAt}`;
        if (key && !seen.has(key)) { seen.add(key); deduped.push(a); }
      }

      const filtered = filterArticlesByPreferences(deduped, selectedPrefs, keywordMap);

      // Translate news if user language is not English
      console.log("Refresh - User language:", userLanguage, "Filtered articles count:", filtered.length);
      if (userLanguage !== 'en') {
        setIsTranslating(true);
        console.log("Refresh - Starting translation to:", userLanguage);
        try {
          const translated = await translationService.translateArticles(filtered, userLanguage, 'en');
          console.log("Refresh - Translation completed:", translated.length, "articles");
          setTranslatedNews(translated);
        } catch (error) {
          console.error("Refresh - Translation error:", error);
          setTranslatedNews(filtered); // Fallback to original
        } finally {
          setIsTranslating(false);
        }
      } else {
        console.log("Refresh - No translation needed, language is English");
        setTranslatedNews(filtered);
      }
      const resultArticles = filterMode === 'all'
          ? deduped
          : filterArticlesByPreferences(deduped, selectedPrefs, keywordMap);
      const now = Date.now();
      localStorage.setItem(cacheKey, JSON.stringify(resultArticles));
      localStorage.setItem(tsKey, now.toString());
    } catch (e) {
      console.error("Error refreshing sports news:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleArticleClick = (article) => {
    console.log("Article clicked:", article.title);
    console.log("User language:", userLanguage);
    console.log("Article data:", {
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url
    });
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedArticle(null);
  };

  return (
    <>
      <ScheduleBar />
      <div className="container mt-5">
        <h2
          className="mb-3 text-center"
          style={{
            fontFamily: "Arial Black, sans-serif",
            color: "#e63946",
          }}
        >
          <TranslatedText>Sports News</TranslatedText>
        </h2>
        <div className="text-center mb-4">
          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleRefresh}
              disabled={loading || isTranslating}
            >
              <TranslatedText>{loading ? "Refreshing…" : isTranslating ? "Translating…" : "Refresh"}</TranslatedText>
            </button>
          {userLanguage !== 'en' && (
            <div className="mt-2">
              <small className="text-muted">
                <TranslatedText>News translated to {translationService.getLanguageName(userLanguage)}</TranslatedText>
              </small>
            </div>
          )}

            <label className="news-filter-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6 }}>
              <span className="news-filter-label-text" style={{ fontSize: 12, opacity: 0.85 }}>Mode</span>
              <select
                value={filterMode}
                onChange={(e) => {
                  const m = e.target.value;
                  setFilterMode(m);
                  try { localStorage.setItem('newsFilterMode', m); } catch (_) {}
                  // clear caches for both modes so switching forces a fresh fetch
                  try {
                    const prefsKey = prefs && prefs.length ? prefs.slice().sort().join('-') : 'all';
                    localStorage.removeItem(`sportsNews:preferences:${prefsKey}`);
                    localStorage.removeItem(`sportsNews:all:${prefsKey}`);
                  } catch (_) {}
                }}
                className="form-select form-select-sm news-filter-select"
                style={{ height: 30 }}
              >
                <option value="preferences"><TranslatedText>By Preferences</TranslatedText></option>
                <option value="all"><TranslatedText>All Articles</TranslatedText></option>
              </select>
            </label>
          </div>
        </div>

        {loading || isTranslating ? (
          <p className="text-center">
            <TranslatedText>{loading ? "Loading latest sports news..." : "Translating news..."}</TranslatedText>
          </p>
        ) : translatedNews.length === 0 ? (
          <p className="text-center"><TranslatedText>No news available. Try again later.</TranslatedText></p>
        ) : (
          <div className="row">
            {translatedNews.map((article, index) => (
              <div key={index} className="col-md-6 mb-4">
                <div
                  className="card h-100 shadow-sm article-card"
                  style={{ border: "2px solid #1d3557" }}
                >
                  {article.urlToImage && (
                    <img
                      src={article.urlToImage}
                      className="card-img-top"
                      alt={article.title}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{article.title}</h5>
                    <p className="card-text">{article.description}</p>
                  </div>
                  <div className="card-footer d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </small>
                    <div className="d-flex gap-2">
                      {userLanguage !== 'en' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleArticleClick(article)}
                        >
                          <TranslatedText>Read Translated</TranslatedText>
                        </button>
                      )}
                      {userLanguage !== 'en' && (
                        <a
                          href={`https://translate.google.com/translate?sl=en&tl=${userLanguage}&u=${encodeURIComponent(article.url)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-warning"
                        >
                          <TranslatedText>Auto Translate</TranslatedText>
                        </a>
                      )}
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
                      >
                        <TranslatedText>Read Original</TranslatedText>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Article Modal */}
      <ArticleModal
        article={selectedArticle}
        userLanguage={userLanguage}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}

export default SportsNewsPage;
