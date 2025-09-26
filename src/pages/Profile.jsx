import React, { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import './Profile.css';
import { supabase } from '../supabaseClient';
import SportsSelection from './SportSelectionPage';
import { Link } from 'react-router-dom';

function Profile() {
    const [session, setSession] = useState(null);
  const [pref, setPref] = useState(null);
  const [toast, setToast] = useState(null); // {type: 'success'|'error'|'info', message: ''}
  const [, setSaving] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        const sub = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
        return () => { try { sub?.data?.unsubscribe(); } catch (e) {} };
    }, []);

    // load preference when session available
    useEffect(() => {
      if (!session) return;
      const uid = session.user?.id || 'anon';

      // try localStorage first (fast), then attempt to load from Supabase
      try {
        const saved = localStorage.getItem(`prefs_${uid}`);
        if (saved) {
          setPref(JSON.parse(saved).preferredSport || JSON.parse(saved).preferredSports || []);
        }
      } catch (e) {}

      // try to load from Supabase preferences table
      (async () => {
        try {
          const { data, error } = await supabase.from('preferences').select('data').eq('user_id', uid).single();
          if (!error && data) {
            const val = data.data || {};
            setPref(val.preferredSports || val.preferredSport || []);
          }
        } catch (e) { /* ignore if table doesn't exist */ }
      })();
    }, [session]);

    const handleSelect = async (selection) => {
      // selection is array of sport names
      setPref(selection);
      setSaving(true);
      setToast({ type: 'info', message: 'Saving preferences…' });
      const uid = session?.user?.id;
      if (!uid) {
        setSaving(false);
        setToast({ type: 'error', message: 'Not signed in' });
        return;
      }

      // save to localStorage
      try { localStorage.setItem(`prefs_${uid}`, JSON.stringify({ preferredSports: selection })); } catch (e) {}

      // try to upsert into Supabase 'preferences' table
      try {
        const payload = { user_id: uid, data: { preferredSports: selection } };
        await supabase.from('preferences').upsert({ user_id: uid, data: payload.data }, { onConflict: 'user_id' });
        setToast({ type: 'success', message: 'Preferences saved' });
      } catch (e) {
        // server upsert failed, local save remains as fallback
        setToast({ type: 'error', message: 'Saved locally (server unavailable)' });
      }
      setSaving(false);
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
              {/** Avatar: try gravatar by email, otherwise initials block */}
              <Avatar email={session.user?.email} id={session.user?.id} />
              <div>
                <div><strong>{session.user?.email || session.user?.id}</strong></div>
                <div style={{color: 'var(--muted)', fontSize: 13}}>Manage your preferences</div>
              </div>
            </div>
            <p>Welcome! Select your preferred sports below.</p>
            <SportsSelection initialSelected={pref} onSelect={handleSelect} />
            <p className="mt-4">Preferred sport(s): <strong>{(pref && Array.isArray(pref) ? pref.join(', ') : pref) || 'None'}</strong></p>
          </div>
          {toast && <div className={`toast ${toast.type}`} role="status">{toast.message}</div>}
        </div>
      </>
    );
}

function md5(s) {
  // small, well-known compact md5 implementation
  // source: https://stackoverflow.com/a/16599668 (compact)
  function L(k, d) { return (k << d) | (k >>> (32 - d)); }
  function K(G, k) {
    var F, H, x;
    F = (G & 65535) + (k & 65535);
    H = (G >> 16) + (k >> 16) + (F >> 16);
    x = (H << 16) | (F & 65535);
    return x;
  }
  function R(G, k, I, d, F, H, x) {
    G = K(G, K(K((k & I) | (~k & d), F), x));
    return K(L(G, H), k);
  }
  function S(G, k, I, d, F, H, x) {
    G = K(G, K(K((k & d) | (I & ~d), F), x));
    return K(L(G, H), k);
  }
  function T(G, k, I, d, F, H, x) {
    G = K(G, K(K(k ^ I ^ d, F), x));
    return K(L(G, H), k);
  }
  function U(G, k, I, d, F, H, x) {
    G = K(G, K(K(I ^ (k | ~d), F), x));
    return K(L(G, H), k);
  }

  var i, j, X, W, V;
  var b = unescape(encodeURIComponent(s));
  var a = b.length;
  var y = []; for (i = 0; i < a; i++) y[i >> 2] |= (b.charCodeAt(i) & 255) << ((i % 4) * 8);
  y[a >> 2] |= 128 << ((a % 4) * 8);
  y[(((a + 8) >> 6) + 1) * 16 - 1] = a * 8;
  var h = 1732584193, g = -271733879, f = -1732584194, e = 271733878;
  for (i = 0; i < y.length; i += 16) {
    j = h; X = g; W = f; V = e;
    h = R(h, g, f, e, y[i + 0], 7, -680876936);
    h = R(h, g, f, e, y[i + 1], 12, -389564586);
    h = R(h, g, f, e, y[i + 2], 17, 606105819);
    h = R(h, g, f, e, y[i + 3], 22, -1044525330);
    h = R(h, g, f, e, y[i + 4], 7, -176418897);
    h = R(h, g, f, e, y[i + 5], 12, 1200080426);
    h = R(h, g, f, e, y[i + 6], 17, -1473231341);
    h = R(h, g, f, e, y[i + 7], 22, -45705983);
    h = R(h, g, f, e, y[i + 8], 7, 1770035416);
    h = R(h, g, f, e, y[i + 9], 12, -1958414417);
    h = R(h, g, f, e, y[i +10], 17, -42063);
    h = R(h, g, f, e, y[i +11], 22, -1990404162);
    h = R(h, g, f, e, y[i +12], 7, 1804603682);
    h = R(h, g, f, e, y[i +13], 12, -40341101);
    h = R(h, g, f, e, y[i +14], 17, -1502002290);
    h = R(h, g, f, e, y[i +15], 22, 1236535329);
    h = S(h, g, f, e, y[i + 1], 5, -165796510);
    h = S(h, g, f, e, y[i + 6], 9, -1069501632);
    h = S(h, g, f, e, y[i +11], 14, 643717713);
    h = S(h, g, f, e, y[i + 0], 20, -373897302);
    h = S(h, g, f, e, y[i + 5], 5, -701558691);
    h = S(h, g, f, e, y[i +10], 9, 38016083);
    h = S(h, g, f, e, y[i +15], 14, -660478335);
    h = S(h, g, f, e, y[i + 4], 20, -405537848);
    h = S(h, g, f, e, y[i + 9], 5, 568446438);
    h = S(h, g, f, e, y[i +14], 9, -1019803690);
    h = S(h, g, f, e, y[i + 3], 14, -187363961);
    h = S(h, g, f, e, y[i + 8], 20, 1163531501);
    h = S(h, g, f, e, y[i +13], 5, -1444681467);
    h = S(h, g, f, e, y[i + 2], 9, -51403784);
    h = S(h, g, f, e, y[i + 7], 14, 1735328473);
    h = S(h, g, f, e, y[i +12], 20, -1926607734);
    h = T(h, g, f, e, y[i + 5], 4, -378558);
    h = T(h, g, f, e, y[i + 8], 11, -2022574463);
    h = T(h, g, f, e, y[i +11], 16, 1839030562);
    h = T(h, g, f, e, y[i +14], 23, -35309556);
    h = T(h, g, f, e, y[i + 1], 4, -1530992060);
    h = T(h, g, f, e, y[i + 4], 11, 1272893353);
    h = T(h, g, f, e, y[i + 7], 16, -155497632);
    h = T(h, g, f, e, y[i +10], 23, -1094730640);
    h = T(h, g, f, e, y[i +13], 4, 681279174);
    h = T(h, g, f, e, y[i + 0], 11, -358537222);
    h = T(h, g, f, e, y[i + 3], 16, -722521979);
    h = T(h, g, f, e, y[i + 6], 23, 76029189);
    h = T(h, g, f, e, y[i + 9], 4, -640364487);
    h = T(h, g, f, e, y[i +12], 11, -421815835);
    h = T(h, g, f, e, y[i +15], 16, 530742520);
    h = T(h, g, f, e, y[i + 2], 23, -995338651);
    h = U(h, g, f, e, y[i + 0], 6, -198630844);
    h = U(h, g, f, e, y[i + 7], 10, 1126891415);
    h = U(h, g, f, e, y[i +14], 15, -1416354905);
    h = U(h, g, f, e, y[i + 5], 21, -57434055);
    h = U(h, g, f, e, y[i +12], 6, 1700485571);
    h = U(h, g, f, e, y[i + 3], 10, -1894986606);
    h = U(h, g, f, e, y[i +10], 15, -1051523);
    h = U(h, g, f, e, y[i + 1], 21, -2054922799);
    h = U(h, g, f, e, y[i + 8], 6, 1873313359);
    h = U(h, g, f, e, y[i +15], 10, -30611744);
    h = U(h, g, f, e, y[i + 6], 15, -1560198380);
    h = U(h, g, f, e, y[i +13], 21, 1309151649);
    h = U(h, g, f, e, y[i + 4], 6, -145523070);
    h = U(h, g, f, e, y[i +11], 10, -1120210379);
    h = U(h, g, f, e, y[i + 2], 15, 718787259);
    h = U(h, g, f, e, y[i + 9], 21, -343485551);
    h = K(h, j); g = K(g, X); f = K(f, W); e = K(e, V);
  }
  var toHex = function (n) {
    var s = "", j = 0, hex = "0123456789abcdef";
    for (; j < 4; j++) s += hex.charAt((n >> (j * 8 + 4)) & 0x0F) + hex.charAt((n >> (j * 8)) & 0x0F);
    return s;
  };
  return toHex(h) + toHex(g) + toHex(f) + toHex(e);
}

function Avatar({ email, id }) {
  const [imgError, setImgError] = React.useState(false);
  const cleaned = (email || '').trim().toLowerCase();
  const hash = cleaned ? md5(cleaned) : null;
  const gravatar = hash ? `https://www.gravatar.com/avatar/${hash}?s=128&d=404` : null;
  const initials = (email || id || '').toString().charAt(0)?.toUpperCase() || '?';

  return (
    <>
      {gravatar && !imgError ? (
        <img src={gravatar} alt="avatar" className="avatar" onError={() => setImgError(true)} style={{objectFit:'cover'}}/>
      ) : (
        <div className="avatar">{initials}</div>
      )}
    </>
  );
}

export default Profile;
