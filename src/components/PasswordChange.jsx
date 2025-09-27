// src/components/ChangePassword.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import "../pages/profile.css"; 


export default function PasswordChange({ session }) {
  const [currPw, setCurrPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  if (!session) {
    return <p className="pw-message">Log in to change your password.</p>;
  }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg("");

    // Optional: block OAuth-only accounts from password change
    const provider = session.user.app_metadata?.provider;
    if (provider && provider !== "email") {
      setPwMsg("This account uses a third-party login (e.g., Google). Manage your password with that provider.");
      return;
    }

    if (!currPw || !newPw || !confirmPw) {
      setPwMsg("Please fill out all fields.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg("New passwords do not match.");
      return;
    }
    if (newPw.length < 6) {
      setPwMsg("Password must be at least 6 characters.");
      return;
    }

    setPwBusy(true);
    try {
      // Re-authenticate with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currPw,
      });
      if (signInError) throw new Error("Current password is incorrect.");

      // Update password
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
      if (updateErr) throw new Error(updateErr.message || "Failed to update password.");

      setPwMsg("Password updated successfully.");
      setCurrPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      setPwMsg(err.message || String(err));
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <>
      <h2>Change Password</h2>
      <form className="password-form" onSubmit={handleChangePassword}>
        <label>
          Current password
          <input
            type="password"
            value={currPw}
            onChange={(e) => setCurrPw(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        <label>
          New password
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            autoComplete="new-password"
          />
        </label>

        <label>
          Confirm new password
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            autoComplete="new-password"
          />
        </label>

        <button type="submit" disabled={pwBusy}>
          {pwBusy ? "Updating…" : "Update Password"}
        </button>
      </form>

      {pwMsg && <div className="pw-message">{pwMsg}</div>}
    </>
  );
}
