// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PasswordChange from "../components/PasswordChange"; 
import SportPrefsForm from "../components/SportsPreference";
import NotificationToggle from "../components/NotificationToggle";
import LanguagePreference from "../components/LanguagePreference";
import "./profile.css";
import { TranslatedText } from "../components/TranslatedText";

export default function Profile() {
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session }, error: sErr } = await supabase.auth.getSession();
      if (sErr) { setError(sErr.message); setLoading(false); return; }
      if (!session) { setError("Not logged in"); setLoading(false); return; }
      setSession(session);

      // Adjust table name if your usernames live in "profiles"
      const { data } = await supabase
        .from("users")
        .select("username")
        .eq("id", session.user.id)
        .maybeSingle();

      const fromTable = data?.username;
      const fromMeta  = session.user.user_metadata?.username;
      const fallback  = session.user.email || "user";
      setUsername(fromTable || fromMeta || fallback);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="profile-container">
        <h1><TranslatedText>Hello</TranslatedText> {username}</h1>
        <NotificationToggle session={session} /> {/* Notification Preferences, SportsPreference, Password Change  - Winston */}
        <SportPrefsForm session={session} />
        <LanguagePreference session={session} />
        <PasswordChange session={session} />

        
    </div>
  );
}
