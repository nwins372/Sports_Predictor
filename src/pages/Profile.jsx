import React, { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import './profile.css';
import { supabase } from '../supabaseClient';
import SportsSelection from './SportSelectionPage';
import { Link } from 'react-router-dom';
import ScheduleBar from '../components/ScheduleBar';
import md5 from 'blueimp-md5';

function Profile() {
  const [session, setSession] = useState(null);
  const [pref, setPref] = useState(null);
  const [toast, setToast] = useState(null); 
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [username, setUsername] = useState(''); // Will show current DB username
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  // --- Load session ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const sub = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => { try { sub?.data?.unsubscribe(); } catch (e) {} };
  }, []);

  // --- Load user preferences ---
  useEffect(() => {
    if (!session) return;
    const uid = session.user?.id || 'anon';

    try {
      const saved = localStorage.getItem(`prefs_${uid}`);
      if (saved) setPref(JSON.parse(saved).preferredSports || []);
    } catch (e) {}

    (async () => {
      try {
        const { data, error } = await supabase.from('preferences').select('data').eq('user_id', uid).single();
        if (!error && data) setPref(data.data?.preferredSports || []);
      } catch (e) {}
    })();
  }, [session]);

  // --- Handle preference selection ---
  const handleSelect = async (selection) => {
    setPref(selection);
    setSaving(true);
    setToast({ type: 'info', message: 'Saving preferences…' });
    const uid = session?.user?.id;
    if (!uid) {
      setSaving(false);
      setToast({ type: 'error', message: 'Not signed in' });
      return;
    }
    try { localStorage.setItem(`prefs_${uid}`, JSON.stringify({ preferredSports: selection })); } catch (e) {}
    try {
      await supabase.from('preferences').upsert({ user_id: uid, data: { preferredSports: selection } }, { onConflict: 'user_id' });
      setToast({ type: 'success', message: 'Preferences saved' });
    } catch (e) {
      setToast({ type: 'error', message: 'Saved locally (server unavailable)' });
    }
    setSaving(false);
  };

  // --- Handle Update Username / Password ---
  const handleUpdateAccount = async () => {
    if (!session) return;

    if (newPassword && newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    setLoadingUpdate(true);

    try {
      // Reauthenticate for password change
      if (currentPassword && newPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: session.user.email,
          password: currentPassword
        });
        if (signInError) throw signInError;

        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) throw passwordError;
      }

      // Update username in database
      if (username) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ username })
          .eq('id', session.user.id);
        if (updateError) throw updateError;
      }

      setToast({ type: 'success', message: 'Account updated successfully!' });
      setModalOpen(false);
      setCurrentPassword(''); 
      setNewPassword(''); 
      setConfirmPassword('');
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', message: e.message || 'Update failed' });
    } finally {
      setLoadingUpdate(false);
    }
  };

  // --- Fetch username when modal opens ---
  const openModal = async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase.from('profiles').select('username').eq('id', session.user.id).single();
      if (!error && data) setUsername(data.username);
    } catch (e) {
      console.error('Error fetching username:', e.message);
    }
    setModalOpen(true);
  };

  if (!session) {
    return (
      <>
        <NavBar />
        <div className="profile-container">
          <h1>User Profile</h1>
          <div className="profile-box">
            <p>You must be logged in to access your profile and preferences.</p>
            <Link to="/login" className="btn btn-primary">Go to Login</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="profile-container">
        <h1>User Profile</h1>
        <div className="profile-box">
          <div className="profile-meta">
            <Avatar email={session.user?.email} id={session.user?.id} />
            <div>
              <div><strong>{session.user?.email || session.user?.id}</strong></div>
              <button className="btn" onClick={openModal}>
                Update Account / Password
              </button>
            </div>
          </div>

          <p>Welcome! Select your preferred sports below.</p>
          <SportsSelection initialSelected={pref} onSelect={handleSelect} />
          <p className="mt-4">Preferred sport(s): <strong>{(pref && Array.isArray(pref) ? pref.join(', ') : pref) || 'None'}</strong></p>

          {pref && (
            <div className="profile-box mt-4">
              <h2>Your Schedule</h2>
              <ScheduleBar defaultSport={Array.isArray(pref) ? pref[0] : pref} />
            </div>
          )}
        </div>

        {toast && <div className={`toast ${toast.type}`} role="status">{toast.message}</div>}

        {/* --- Modal --- */}
        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Update Account</h2>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="New username"
                  autoComplete="off"
                />
              </div>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  autoComplete="current-password"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password"
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleUpdateAccount} disabled={loadingUpdate}>
                  {loadingUpdate ? 'Updating…' : 'Update'}
                </button>
                <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// --- Avatar Component ---
function Avatar({ email, id }) {
  const [imgError, setImgError] = React.useState(false);
  const cleaned = (email || '').trim().toLowerCase();
  const hash = cleaned ? md5(cleaned) : null;
  const gravatar = hash ? `https://www.gravatar.com/avatar/${hash}?s=128&d=404` : null;
  const initials = (email || id || '').toString().charAt(0)?.toUpperCase() || '?';

  return gravatar && !imgError ? (
    <img src={gravatar} alt="avatar" className="avatar" onError={() => setImgError(true)} style={{objectFit:'cover'}}/>
  ) : (
    <div className="avatar">{initials}</div>
  );
}

export default Profile;
