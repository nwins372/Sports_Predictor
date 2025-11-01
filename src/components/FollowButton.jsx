import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function FollowButton({ entityType = 'player', entityId, label, entityMeta }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!entityId) return;
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user || null;
        if (!user) {
          if (mounted) setFollowing(false);
          return;
        }
        const q = await supabase
          .from('follows')
          .select('*')
          .eq('user_id', user.id)
          .eq('entity_type', entityType)
          .eq('entity_id', String(entityId))
          .limit(1);
        if (mounted) setFollowing(Array.isArray(q.data) && q.data.length > 0);
      } catch (e) {
        // ignore - table may not exist or network error
        console.warn('FollowButton:init', e.message || e);
      }
    })();
    return () => { mounted = false; };
  }, [entityType, entityId]);

  const onToggle = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user || null;
      if (!user) {
        // take user to login
        navigate('/login');
        return;
      }

      if (following) {
        // delete follow
        try {
          await supabase
            .from('follows')
            .delete()
            .eq('user_id', user.id)
            .eq('entity_type', entityType)
            .eq('entity_id', String(entityId));
        } catch (e) { console.warn('FollowButton:delete', e); }
        setFollowing(false);
      } else {
        // insert follow
        try {
          await supabase
            .from('follows')
            .insert({ user_id: user.id, entity_type: entityType, entity_id: String(entityId) });
        } catch (e) { console.warn('FollowButton:insert', e); }
        setFollowing(true);
        // If this is a team follow, also update the user's favorite team preference
        if (entityType === 'team') {
          try {
            const fav = { id: entityId, name: entityMeta?.name || label || String(entityId) };
            try { localStorage.setItem('team_pref', JSON.stringify(fav)); } catch (e) {}
            // upsert into preferences table for logged-in user
            await supabase.from('preferences').upsert({ user_id: user.id, data: { favorite_team: fav } }, { onConflict: 'user_id' });
          } catch (e) {
            console.warn('FollowButton:upsertPreference', e);
          }
        }
      }
    } catch (e) {
      console.warn('FollowButton:toggle', e.message || e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className={`follow-button ${following ? 'following' : ''}`} onClick={onToggle} disabled={loading} aria-pressed={following}>
      {loading ? '…' : (following ? (label || 'Following') : (label || 'Follow'))}
    </button>
  );
}
