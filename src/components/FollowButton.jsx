import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { TranslatedText } from './TranslatedText';

export default function FollowButton({ entityType = 'player', entityId, label, entityMeta, league }) {
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
        // Check users table for followed_players or followed_teams array
        const column = entityType === 'player' ? 'followed_players' : 'followed_teams';
        const { data: userRow } = await supabase
          .from('users')
          .select(column)
          .eq('id', user.id)
          .single();
        const arr = userRow?.[column] || [];
        // Check for both league-prefixed and non-prefixed IDs (for both players and teams)
        const idStr = league ? `${league}:${entityId}` : String(entityId);
        const idStrWithoutLeague = String(entityId);
        if (mounted) setFollowing(arr.includes(idStr) || arr.includes(idStrWithoutLeague));
      } catch (e) {
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
        navigate('/login');
        return;
      }

      const column = entityType === 'player' ? 'followed_players' : 'followed_teams';
      const { data: userRow } = await supabase
        .from('users')
        .select(column)
        .eq('id', user.id)
        .single();
      
      let arr = userRow?.[column] || [];
      // Store both teams and players with league prefix (e.g., "nba:4279888" or "nfl:memphis-grizzlies")
      const idStr = league ? `${league}:${entityId}` : String(entityId);
      const idStrWithoutLeague = String(entityId);

      if (following) {
        // remove from array (check both with and without league prefix)
        arr = arr.filter(x => String(x) !== idStr && String(x) !== idStrWithoutLeague);
        setFollowing(false);
      } else {
        // add to array with league prefix
        if (!arr.includes(idStr)) arr.push(idStr);
        setFollowing(true);
        // If team follow, update favorite team preference
        if (entityType === 'team') {
          try {
            const fav = { id: entityId, name: entityMeta?.name || label || String(entityId) };
            try { localStorage.setItem('team_pref', JSON.stringify(fav)); } catch (e) {}
            await supabase.from('preferences').upsert({ user_id: user.id, data: { favorite_team: fav } }, { onConflict: 'user_id' });
          } catch (e) {
            console.warn('FollowButton:upsertPreference', e);
          }
        }
      }

      // Update users table
      await supabase
        .from('users')
        .update({ [column]: arr })
        .eq('id', user.id);
    } catch (e) {
      console.warn('FollowButton:toggle', e.message || e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className={`follow-button ${following ? 'following' : ''}`} onClick={onToggle} disabled={loading} aria-pressed={following}>
      <TranslatedText>{loading ? '…' : (following ? (label || 'Following') : (label || 'Follow'))}</TranslatedText>
    </button>
  );
}
