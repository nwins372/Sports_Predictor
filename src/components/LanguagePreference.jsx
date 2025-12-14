import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./LanguagePreference.css";
import { useSessionForSchedulesPage } from "../pages/Schedules";
import { TranslatedText } from "./TranslatedText";

const SUPPORTED_LANGUAGES = {
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

export default function LanguagePreference() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const { session } = useSessionForSchedulesPage();

  useEffect(() => {
    if (!session) return;
    
    const loadLanguagePreference = async () => {
      setLoading(true);
      setMessage("");

      try {
        // Try to load from database first
        const { data, error } = await supabase
          .from("user_preferences")
          .select("preferred_language")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) {
          console.log("Database load failed, checking localStorage:", error);
          // Fallback to localStorage
          const localLanguage = localStorage.getItem('user_preferred_language');
          if (localLanguage) {
            setSelectedLanguage(localLanguage);
          }
        } else if (data?.preferred_language) {
          setSelectedLanguage(data.preferred_language);
        } else {
          // Check localStorage as fallback
          const localLanguage = localStorage.getItem('user_preferred_language');
          if (localLanguage) {
            setSelectedLanguage(localLanguage);
          }
        }
      } catch (error) {
        console.error("Error loading language preference:", error);
        // Fallback to localStorage
        const localLanguage = localStorage.getItem('user_preferred_language');
        if (localLanguage) {
          setSelectedLanguage(localLanguage);
        }
      } finally {
        setLoading(false);
      }
    };

    loadLanguagePreference();
  }, [session]);

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
    console.log("Language changed to:", e.target.value);
  };

  const handleSave = async () => {
    if (!session) return;

    setSaving(true);
    setMessage("");

    try {
      // First, try to update only the preferred_language field (preserves other columns)
      const { data: updateData, error: updateError } = await supabase
        .from("user_preferences")
        .update({ preferred_language: selectedLanguage })
        .eq("user_id", session.user.id);

      if (updateError) {
        throw updateError;
      }

      // If no rows were updated (record doesn't exist), insert instead
      const updatedCount = updateData?.length || 0;
      if (updatedCount === 0) {
        const { error: insertError } = await supabase
          .from("user_preferences")
          .insert({
            user_id: session.user.id,
            preferred_language: selectedLanguage,
            sports_prefs: [],
            favorite_teams: {}
          });

        if (insertError) {
          throw insertError;
        }
      }

      // Also save to localStorage even when database succeeds
      localStorage.setItem('user_preferred_language', selectedLanguage);
      console.log("Saved to both database and localStorage:", selectedLanguage);
      setMessage("Language preference saved successfully!");
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage("");
      }, 3000);

    } catch (error) {
      console.error("Error saving language preference:", error);
      
      // If database column doesn't exist, fall back to localStorage
      if (error.message && error.message.includes("column")) {
        localStorage.setItem('user_preferred_language', selectedLanguage);
        setMessage("Language preference saved locally! (Database column needs to be added)");
        
        // Clear message after 5 seconds
        setTimeout(() => {
          setMessage("");
        }, 5000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="language-preference-card">
        <h3 className="language-preference-title">Preferred Language</h3>
        <p>Loading language preferences...</p>
      </div>
    );
  }

  return (
    <div className="language-preference-card">
      <h3 className="language-preference-title"><TranslatedText>Preferred Language</TranslatedText></h3>
      <p className="language-preference-description">
        <TranslatedText>Choose your preferred language. The website and sports news articles will be automatically translated to your selected language.</TranslatedText>
      </p>
      
      <div className="language-selection">
        <label htmlFor="language-select" className="language-label">
          <TranslatedText>Select Language:</TranslatedText>
        </label>
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={handleLanguageChange}
          className="language-select"
          disabled={saving}
        >
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="language-save-btn"
      >
        <TranslatedText>{saving ? "Saving..." : "Save Language Preference"}</TranslatedText>
      </button>

      {message && (
        <div className={`language-message ${message.includes("Error") ? "error" : "success"}`}>
          <TranslatedText>{message}</TranslatedText>
        </div>
      )}
    </div>
  );
}
