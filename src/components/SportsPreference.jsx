import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./SportsPreference.css";

const all_sports = ["NFL", "NBA", "MLB", "College Sports"];

export default function SportPrefsForm({ session }) {
  const [checked, setChecked] = useState([]);   
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!session) return;
    const uid = session.user.id;

    (async () => {
      setLoading(true);
      setMsg("");

      const { data, error } = await supabase
        .from("user_preferences")
        .select("sports_prefs")
        .eq("user_id", uid)
        .maybeSingle();

      if (error) {
        setMsg("Could not load preferences.");
        setChecked([]); 
      } else {
        const arr = Array.isArray(data?.sports_prefs) ? data.sports_prefs : [];
        setChecked(arr);
      }

      setLoading(false);
    })();
  }, [session]);

  const toggle = (sport) => {
    setChecked((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const save = async () => {
    if (!session) { setMsg("You must be logged in."); return; }
    setSaving(true);
    setMsg("");

    const uid = session.user.id;

    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: uid, sports_prefs: checked }, 
        { onConflict: "user_id" }              
      );

    if (error) {
      setMsg(error.message || "Failed to save preferences.");
    } else {
      setMsg("Preferences saved.");
    }
    setSaving(false);
  };

  if (!session) return <p className="prefs-note">Log in to manage preferences.</p>;
  if (loading)    return <p className="prefs-note">Loading preferences…</p>;

  console.log("Rendering sports:", all_sports);
  
  return (
    <div className="prefs-card">
      <h2 className="prefs-title">Your Sports</h2>
      <div className="prefs-grid">
        {all_sports.map((sport) => (
          <label key={sport} className="prefs-item">
            <input
              type="checkbox"
              checked={checked.includes(sport)}
              onChange={() => toggle(sport)}
            />
            <span>{sport}</span>
          </label>
        ))}
      </div>

      <button className="prefs-save-btn" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>

      {msg && <div className="prefs-msg">{msg}</div>}
    </div>
  );
}
