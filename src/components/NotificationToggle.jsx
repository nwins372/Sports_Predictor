import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../pages/profile.css";
import "./NotificationToggle.css";
import { TranslatedText } from "./TranslatedText";

export default function NotificationToggle({ session }) {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [frequency, setFrequency] = useState("daily"); // 'daily' | 'weekly_mon'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load current value from DB
  useEffect(() => {
    setLoading(true);
    setMessage("");

    if (!session) {
      setLoading(false);
      return;
    }

    const uid = session.user.id;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("users")
        .select("notifications, notify_frequency")
        .eq("id", uid)
        .maybeSingle();

      if (!cancelled) {
        if (error) {
          console.error(error);
          setMessage("Could not load notification settings.");
          setNotifEnabled(false);
          setFrequency("daily");
        } else {
          setNotifEnabled(!!data?.notifications);
          setFrequency(data?.notify_frequency || "daily");
        }
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [session]);

  // Save to DB (checkbox and frequency)
  const persist = async (nextEnabled, nextfrequency) => {
    if (!session) {
      setMessage("You must be logged in.");
      return;
    }
    const uid = session.user.id;
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("users")
      .upsert(
        { id: uid, notifications: nextEnabled, notify_frequency: nextfrequency },
        { onConflict: "id" }
      );

    if (error) {
      console.error(error);
      setMessage(error.message || "Failed to save notification settings.");
      // (optional) rollback UI if you want
    } else {
      setMessage("Notification settings saved.");
    }
    setSaving(false);
  };

  const onToggle = (e) => {
    const next = e.target.checked;
    setNotifEnabled(next);          
    persist(next, frequency);
  };

  const onfrequencyChange = (e) => {
    const next = e.target.value;
    setFrequency(next);              
    persist(notifEnabled, next);
  };

  if (!session) {
    return <p className="notif-message"><TranslatedText>Log in to manage notifications.</TranslatedText></p>;
  }

  return (
    <>
      <h2><TranslatedText>Notifications</TranslatedText></h2>
      <div className="notification-grid">
        <label className="notif-switch">
          <input
            type="checkbox"
            className="notif-checkbox"
            checked={notifEnabled}
            onChange={onToggle}
            disabled={loading || saving}
            aria-label="Toggle email notifications"
          />
          <span className="notif-label">
            {loading ? <TranslatedText>Loading…</TranslatedText> : <TranslatedText>Email me periodic updates</TranslatedText>}
          </span>
        </label>

        {/* frequency picker */}
        <label className="notif-frequency">
          <span><TranslatedText>Frequency</TranslatedText></span>
          <select
            className="notif-select"
            value={frequency}
            onChange={onfrequencyChange}
            disabled={loading || saving}
          >
            <option value="daily"><TranslatedText>Daily</TranslatedText></option>
            <option value="weekly_son"><TranslatedText>Every Sunday</TranslatedText></option>
            <option value="weekly_mon"><TranslatedText>Every Monday</TranslatedText></option>
          </select>
        </label>

        {message && <div className="notif-message">{message}</div>}
      </div>
    </>
  );
}
