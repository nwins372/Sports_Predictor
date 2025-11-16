import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { TranslatedText } from './TranslatedText';

export default function LoginModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMagicLink = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setMessage('Check your email for the sign-in link.');
    } catch (err) {
      setMessage(err.message || 'Error sending link');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 540, margin: '20px auto', padding: 16, border: '1px solid var(--muted)', borderRadius: 8 }}>
      <h3><TranslatedText>Sign in</TranslatedText></h3>
      <p><TranslatedText>Enter your email and we'll send a magic sign-in link.</TranslatedText></p>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: 8, marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleMagicLink} className="btn btn-primary" disabled={loading || !email}>{loading ? <TranslatedText>Sending...</TranslatedText> : <TranslatedText>Send link</TranslatedText>}</button>
        <button onClick={onClose} className="btn btn-secondary"><TranslatedText>Close</TranslatedText></button>
      </div>
      {message && <p style={{ marginTop: 8 }}><TranslatedText>{message}</TranslatedText></p>}
    </div>
  );
}
