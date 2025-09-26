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
  const [pref, setPref] = useState(''); // single sport
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [displayName, setDisplayName] = useState(null);

  // --- Load session ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const sub = supabase.auth.onAuthStateChange((_event, session) =>
      setSession(session)
    );
    return () => {
      try {
        sub?.data?.unsubscribe();
      } catch (e) {}
    };
  }, []);

  // --- Load username + preferences ---
  useEffect(() => {
    if (!session) return;
    const uid = session.user?.id || 'anon';

    try {
      const saved = localStorage.getItem(`prefs_${uid}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.preferredSport) setPref(parsed.preferredSport);
      }
    } catch (e) {}

    (async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', uid)
          .single();
        if (!profileError && profile) {
          setDisplayName(profile.username || session.user.email);
        } else {
          setDisplayName(session.user.email);
        }

        const { data, error } = await supabase
          .from('preferences')
          .select('data')
          .eq('user_id', uid)
          .single();

        if (!error && data) {
          setPref(data.data?.preferredSport || '');
          localStorage.setItem(
            `prefs_${uid}`,
            JSON.stringify({
              preferredSport: data.data?.preferredSport || '',
            })
          );
        }
      } catch (e) {
        console.error('Error loading profile data:', e);
      }
    })();
  }, [session]);

  // --- Handle preference selection ---
  const handleSelect = async (selection) => {
    const uid = session?.user?.id;
    if (!uid) return;

    const updated = pref === selection ? '' : selection;

    setPref(updated);
    setSaving(true);
    setToast({ type: 'info', message: 'Saving preferences…' });

    try {
      await supabase.from('preferences').upsert(
        { user_id: uid, data: { preferredSport: updated } },
        { onConflict: 'user_id' }
      );
      localStorage.setItem(
        `prefs_${uid}`,
        JSON.stringify({ preferredSport: updated })
      );
      setToast({ type: 'success', message: 'Preferences saved' });
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', message: 'Error saving preferences' });
    }
    setSaving(false);
  };

  // --- Update username only ---
  const handleUpdateUsername = async () => {
    if (!session) return;
    if (!username) {
      setToast({ type: 'error', message: 'Username cannot be empty' });
      return;
    }

    setLoadingUpdate(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', session.user.id);
      if (updateError) throw updateError;

      setDisplayName(username);
      setToast({ type: 'success', message: 'Username updated successfully!' });
      setUsername('');
      setModalOpen(false);
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', message: e.message || 'Update failed' });
    } finally {
      setLoadingUpdate(false);
    }
  };

  // --- Update password only ---
  const handleUpdatePassword = async () => {
    if (!session) return;
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    setLoadingUpdate(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      });
      if (signInError) throw signInError;

      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (passwordError) throw passwordError;

      setToast({ type: 'success', message: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setModalOpen(false);
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', message: e.message || 'Password update failed' });
    } finally {
      setLoadingUpdate(false);
    }
  };

  if (!session) {
    return (
      <>
        <NavBar />
        <div className="profile-container">
          <h1>User Profile</h1>
          <div className="profile-box">
            <p>You must be logged in to access your profile and preferences.</p>
            <Link to="/login" className="btn btn-primary">
              Go to Login
            </Link>
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
              <div>
                <strong>{displayName}</strong>
              </div>
              <button className="btn" onClick={() => setModalOpen(true)}>
                Update Account
              </button>
            </div>
          </div>

          <p>Welcome! Select your preferred sport below.</p>
          <SportsSelection selectedSports={pref} onSelect={handleSelect} />

          <p className="mt-4">
            Preferred sport: <strong>{pref || 'None'}</strong>
          </p>

          {pref && (
            <div className="profile-box mt-4">
              <h2>Your Schedule</h2>
              <ScheduleBar defaultSport={pref} />
            </div>
          )}
        </div>

        {toast && (
          <div className={`toast ${toast.type}`} role="status">
            {toast.message}
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Update Account</h2>

              {/* Username section */}
              <div className="form-group">
                <label>New Username</label>
                {/* dummy hidden input to trick autofill */}
                <input type="text" style={{ display: 'none' }} autoComplete="username" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter new username"
                  autoComplete="new-username"
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleUpdateUsername}
                disabled={loadingUpdate}
              >
                {loadingUpdate ? 'Updating…' : 'Update Username'}
              </button>

              <hr />

              {/* Password section */}
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" style={{ display: 'none' }} autoComplete="current-password" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleUpdatePassword}
                disabled={loadingUpdate}
              >
                {loadingUpdate ? 'Updating…' : 'Update Password'}
              </button>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
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
  const gravatar = hash
    ? `https://www.gravatar.com/avatar/${hash}?s=128&d=404`
    : null;
  const initials =
    (email || id || '').toString().charAt(0)?.toUpperCase() || '?';

  return gravatar && !imgError ? (
    <img
      src={gravatar}
      alt="avatar"
      className="avatar"
      onError={() => setImgError(true)}
      style={{ objectFit: 'cover' }}
    />
  ) : (
    <div className="avatar">{initials}</div>
  );
}

export default Profile;
