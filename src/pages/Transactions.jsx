import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import espnApi from '../utils/espnApi';
import './Transactions.css';
import { TranslatedText } from '../components/TranslatedText';

// ESPN RSS feeds by league
const RSS_FEEDS = {
  nfl: 'https://www.espn.com/espn/rss/nfl/news',
  nba: 'https://www.espn.com/espn/rss/nba/news',
};

// Strong injury patterns and blocklist to reduce false positives
const STRONG_INJURY_PATTERNS = [
  /\binjury\b/i,
  /\binjured\b/i,
  /\binjuries\b/i,
  /\bquestionable\b/i,
  /\bdoubtful\b/i,
  /\bprobable\b/i,
  /\bruled out\b/i,
  /\bday-to-day\b/i,
  /\bgame[- ]time decision\b/i,
  /\bwill not play\b/i,
  /\bexpected to miss\b/i,
];

// Avoid common non-injury “out/ruled” phrases
const BLOCKLIST = [
  /\boutperform/i,
  /\boutplayed/i,
  /\boutlast/i,
  /\bshutout\b/i,
  /\bshut down\b/i,             
  /\bout of the playoffs/i,
  /\bplayoff hopes\b/i,
];

const PLAYER_PATTERN = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/;
const BODY_PARTS = /\b(ankle|knee|hamstring|hip|groin|foot|hand|wrist|shoulder|back|rib|toe|calf)\b/i;

function isInjuryNewsLike({ title, description }) {
  const combined = `${title} ${description}`.toLowerCase();

  // Hard block some obviously non-injury patterns
  if (BLOCKLIST.some((rx) => rx.test(combined))) return false;

  // Require at least one strong injury phrase
  const strongHit = STRONG_INJURY_PATTERNS.some((rx) => rx.test(combined));
  if (!strongHit) return false;

  // Prefer headlines that mention a player-like name
  const hasPlayer =
    PLAYER_PATTERN.test(title || '') || PLAYER_PATTERN.test(description || '');

  if (hasPlayer) return true;

  // If no player found, still accept if we see a body-part word (ankle, knee, etc.)
  return BODY_PARTS.test(combined);
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  // injuries now = flat array of RSS items
  const [injuryNews, setInjuryNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState('nfl');
  const [followedTeams, setFollowedTeams] = useState([]);

  const [filterTeamsOnly, setFilterTeamsOnly] = useState(false);

  useEffect(() => {
    // Load followed teams from localStorage (same behavior as before)
    try {
      const local = window.localStorage.getItem('followedTeams');
      if (local) setFollowedTeams(JSON.parse(local));
    } catch (e) {
      console.error('Error reading followedTeams from localStorage', e);
    }

    (async () => {
      setLoading(true);
      try {
 
        const tx = await espnApi.getTransactions(league, null, 300);
        setTransactions(tx || []);

        // ----- Injury RSS -----
        const rssUrl = RSS_FEEDS[league];
        if (!rssUrl) {
          setInjuryNews([]);
        } else {
          try {
            const res = await fetch(rssUrl);
            if (!res.ok) {
              console.error('RSS HTTP error:', res.status);
              setInjuryNews([]);
            } else {
              const xmlText = await res.text();

              if (
                typeof window === 'undefined' ||
                typeof window.DOMParser === 'undefined'
              ) {
              
                setInjuryNews([]);
              } else {
                const parser = new window.DOMParser();
                const doc = parser.parseFromString(xmlText, 'application/xml');
                const items = Array.from(doc.querySelectorAll('item'));

                const mapped = items
                  .map((item) => {
                    const title =
                      item.querySelector('title')?.textContent || '';
                    const description =
                      item.querySelector('description')?.textContent || '';
                    const link =
                      item.querySelector('link')?.textContent || '';
                    const pubDate =
                      item.querySelector('pubDate')?.textContent || '';

                    return { title, description, link, pubDate };
                  })
                  .filter(isInjuryNewsLike);

                setInjuryNews(mapped);
              }
            }
          } catch (err) {
            console.error('Error fetching injury RSS:', err);
            setInjuryNews([]);
          }
        }
      } catch (e) {
        console.error('Error loading transactions:', e);
        setTransactions([]);
        setInjuryNews([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [league]);

  const toggleFollowTeam = (slug) => {
    const next = Array.isArray(followedTeams) ? [...followedTeams] : [];
    const idx = next.indexOf(slug);
    if (idx === -1) next.push(slug);
    else next.splice(idx, 1);
    setFollowedTeams(next);
    try {
      window.localStorage.setItem('followedTeams', JSON.stringify(next));
    } catch (e) {
      console.error('Error saving followedTeams to localStorage', e);
    }
  };

  const filtered = transactions.filter((t) => {
    if (!filterTeamsOnly || !followedTeams || followedTeams.length === 0)
      return true;

    try {
      if (
        (t.teams || []).some(
          (team) =>
            team &&
            followedTeams.includes(
              team.slug || String(team.name || '').toLowerCase(),
            ),
        )
      )
        return true;

      if (
        (t.players || []).some(
          (p) =>
            p &&
            followedTeams.includes(String(p.team || '').toLowerCase()),
        )
      )
        return true;
    } catch (e) {
      console.error('Error filtering transactions', e);
    }

    return false;
  });

  return (
    <div className="transactions-page">
      <h2>
        <TranslatedText>Transactions & Injury Reports</TranslatedText>
      </h2>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <label>
          <TranslatedText>League:</TranslatedText>{' '}
        </label>
        <select
          value={league}
          onChange={(e) => setLeague(e.target.value)}
          style={{ minWidth: 120 }}
        >
          <option value="nfl">NFL</option>
          <option value="nba">NBA</option>
        </select>

        <label style={{ marginLeft: 12 }}>
          <input
            type="checkbox"
            checked={filterTeamsOnly}
            onChange={(e) => setFilterTeamsOnly(e.target.checked)}
          />{' '}
          <TranslatedText>Show only followed teams</TranslatedText>
        </label>

        <div style={{ marginLeft: 'auto' }}>
          <strong>
            <TranslatedText>Followed teams:</TranslatedText>
          </strong>{' '}
          {followedTeams && followedTeams.length ? (
            followedTeams.join(', ')
          ) : (
            <span style={{ fontWeight: 600 }}>
              <TranslatedText>None</TranslatedText>
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div>
          <TranslatedText>Loading transactions…</TranslatedText>
        </div>
      ) : (
        <div className="transactions-list">
          {filtered.length === 0 ? (
            <div style={{ color: '#666' }}>
              <TranslatedText>No transactions found.</TranslatedText>
            </div>
          ) : (
            filtered.map((t, idx) => (
              <TransactionRow
                key={idx}
                tx={t}
                onToggleFollow={toggleFollowTeam}
                followedTeams={followedTeams}
              />
            ))
          )}
        </div>
      )}

      {/* Injury report based on ESPN RSS */}
      <div style={{ marginTop: 24 }}>
        <h3>
          <TranslatedText>Injury reports</TranslatedText>
        </h3>
        {injuryNews.length === 0 ? (
          <div style={{ color: '#666' }}>
            <TranslatedText>
              No recent injury-related headlines found for this league.
            </TranslatedText>
          </div>
        ) : (
          <div className="injury-list">
            {injuryNews.map((item, idx) => {
              const pub =
                item.pubDate && !Number.isNaN(Date.parse(item.pubDate))
                  ? new Date(item.pubDate).toLocaleString()
                  : null;
              return (
                <div key={idx} className="injury-card">
                  <h4>{item.title}</h4>
                  {pub && (
                    <div
                      style={{
                        fontSize: '0.85rem',
                        opacity: 0.75,
                        marginBottom: 4,
                      }}
                    >
                      {pub}
                    </div>
                  )}
                  {item.description && (
                    <p
                      style={{
                        fontSize: '0.9rem',
                        marginBottom: 6,
                      }}
                    >
                      {item.description}
                    </p>
                  )}
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.9rem' }}
                    >
                      <TranslatedText>Read on ESPN</TranslatedText>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionRow({ tx, onToggleFollow, followedTeams }) {
  const date = tx.date ? new Date(tx.date).toLocaleString() : null;
  const action = tx.action || 'other';

  return (
    <div className="transaction-row">
      <div className="tx-left">
        <div className="tx-date">{date}</div>
        <div className="tx-action">{action.toUpperCase()}</div>
      </div>

      <div className="tx-body">
        {action === 'trade' ? (
          <div className="trade-box">
            {(tx.teams || []).map((team, i) => (
              <div key={`team-${i}`} className="trade-team">
                {team.logo ? (
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="team-logo-small"
                  />
                ) : (
                  <div className="team-logo-small placeholder" />
                )}
                <div className="team-name">{team.name}</div>
              </div>
            ))}
            <div className="trade-players">
              {(tx.players || []).map((p, i) => (
                <div key={`p-${i}`} className="trade-player">
                  {p.headshot ? (
                    <img
                      src={p.headshot}
                      alt={p.name}
                      className="player-headshot-small"
                    />
                  ) : (
                    <div className="player-headshot-small placeholder" />
                  )}
                  <div className="player-name">{p.name}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="simple-tx">
            {(tx.players || []).map((p, i) => (
              <div key={`s-${i}`} className="simple-player">
                <div style={{ position: 'relative' }}>
                  {p.headshot ? (
                    <img
                      src={p.headshot}
                      alt={p.name}
                      className="player-headshot-small"
                    />
                  ) : (
                    <div className="player-headshot-small placeholder" />
                  )}
                  <span
                    className={`tx-badge ${
                      action === 'add' ? 'add' : action === 'cut' ? 'cut' : ''
                    }`}
                  >
                    {action === 'add'
                      ? '+'
                      : action === 'cut'
                      ? '−'
                      : ''}
                  </span>
                </div>
                <div className="player-name">{p.name}</div>
                {p.team && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      opacity: 0.8,
                    }}
                  >
                    {p.team}
                  </div>
                )}
                {p.teamSlug && (
                  <button
                    className="follow-btn"
                    onClick={() =>
                      onToggleFollow(
                        p.teamSlug ||
                          String(p.team || '').toLowerCase(),
                      )
                    }
                  >
                    {followedTeams.includes(
                      p.teamSlug ||
                        String(p.team || '').toLowerCase(),
                    ) ? (
                      <TranslatedText>Unfollow</TranslatedText>
                    ) : (
                      <TranslatedText>Follow</TranslatedText>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tx-right">
        {(tx.teams || []).map((t, i) => {
          const slug =
            t.slug || String(t.name || '').toLowerCase();
          const isFollowed = followedTeams.includes(slug);
          return (
            <div
              key={`f-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <button
                className="follow-btn"
                onClick={() => onToggleFollow(slug)}
              >
                {isFollowed ? (
                  <TranslatedText>Unfollow</TranslatedText>
                ) : (
                  <TranslatedText>Follow</TranslatedText>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
