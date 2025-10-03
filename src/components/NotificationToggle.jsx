import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../pages/profile.css";
import "./NotificationToggle.css";

export default function NotificationToggle({ session }) {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    const uid = session.user.id;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setMessage("");
      const { data, error } = await supabase
        .from("users")
        .select("notifications")
        .eq("id", uid)
        .maybeSingle();

      if (!cancelled) {
        if (error) {
          console.error(error);
          setMessage("Could not load notification setting.");
          setNotifEnabled(false);
        } else {
          setNotifEnabled(!!data?.notifications);
        }
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const save = async (next) => {
    if (!session) {
      setMessage("You must be logged in.");
      return;
    }
    const uid = session.user.id;
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("users")
      .upsert({ id: uid, notifications: next }, { onConflict: "id" });

    if (error) {
      console.error(error);
      setMessage(error.message || "Failed to save notifications.");
      // rollback if needed
      setNotifEnabled((prev) => !next ? prev && prev : prev || false);
    } else {
      setMessage("Notification preference saved.");
    }
    setSaving(false);
  };

  const onToggle = (e) => {
    const next = e.target.checked;
    setNotifEnabled(next); // optimistic update
    save(next);
  };

  if (!session) {
    return <p className="notif-message">Log in to manage notifications.</p>;
  }

  return (
    <>
      <h2>Notifications</h2>
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
            {loading ? "Loading…" : "Email me periodic updates"}
          </span>
        </label>
        {message && <div className="notif-message">{message}</div>}
      </div>
    </>
  );
}
