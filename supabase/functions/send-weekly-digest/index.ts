import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createTransport } from "npm:nodemailer";

// Import schedule data
import nflSchedule from './nfl25.json' assert { type: 'json' }
import nbaSchedule from './nba25.json' assert { type: 'json' }
import mlbSchedule from './mlb25.json' assert { type: 'json' }


import { XMLParser } from "fast-xml-parser";

const espnRSS = "https://www.espn.com/espn/rss/news";

const fetchESPNNews = async () => {
  const res = await fetch(espnRSS, {
    headers: { "User-Agent": "Mozilla/5.0 (EdgeFunction)" }
  });
  if (!res.ok) {
    console.warn("[Edge Function] ESPN RSS HTTP error:", res.status);
    return [];
  }
  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: ""
  });
  const data = parser.parse(xml);
  const items = data?.rss?.channel?.item ?? [];

  // Normalize to {title, link, pubDate}
  return items.slice(0, 5).map((it: any) => ({
    title: (it?.title ?? "").toString().trim(),
    link:  (it?.link  ?? "").toString().trim(),
    pubDate: (it?.pubDate ?? "").toString().trim()
  })).filter(n => n.title && n.link);
};



const escapeHtml = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

let espnNews: Array<{title: string; link: string; pubDate: string}> = [];
try {
  espnNews = await fetchESPNNews();
  console.log("[Edge Function] Pulled ESPN headlines:", espnNews.length);
} catch (e) {
  console.warn("[Edge Function] ESPN RSS fetch failed:", e);
  espnNews = [];
}

const newsBlock = espnNews.length ? `
  <div style="margin-top:24px; border-top:1px solid #374151; padding-top:16px;">
    <h3 style="margin:0 0 12px; font-size:18px; color:#F3F4F6; text-align:center;">Top ESPN Headlines</h3>
    <ul style="margin:0; padding:0; list-style:none;">
      ${espnNews.map(item => `
        <li style="margin:0 0 10px; line-height:1.5;">
          <a href="${escapeHtml(item.link)}" style="color:#93C5FD; text-decoration:none;">
            ${escapeHtml(item.title)}
          </a>
          <div style="font-size:12px; color:#9CA3AF; margin-top:2px;">
            ${escapeHtml(item.pubDate)}
          </div>
        </li>
      `).join("")}
    </ul>
  </div>
` : "";


const parseDate = (game: any): Date => {
    // Ensure 'game' is an object before accessing properties
    if (!game || typeof game !== 'object') {
        // console.warn("[Edge Function] Invalid game object passed to parseDate:", game);
        return new Date('invalid date');
    }
    const dateStr = game.DateUtc || game.DateUTC || game.dateUtc || game.date;
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes(':')) {
        return new Date('invalid date');
    }
    try {
        const parsed = new Date(dateStr.replace(" ", "T"));
        if (isNaN(parsed.getTime())) { // Stricter check for invalid date
      
             return new Date('invalid date');
        }
        return parsed;
    } catch (e) {
        console.error("[Edge Function] Error parsing date string:", dateStr, e);
        return new Date('invalid date');
    }
};
const ymdLocal = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const filterGamesForUser = (allUpcomingGames: any[], sportsPrefs: string[] | null, favoriteTeams: { [key: string]: string[] } | null): any[] => {
    const gamesToFilter = Array.isArray(allUpcomingGames) ? allUpcomingGames : [];

    // Safely normalize preferences
    const preferredLeagues = (Array.isArray(sportsPrefs) && sportsPrefs.length > 0)
        ? sportsPrefs.map(s => String(s || '').toUpperCase()).filter(Boolean) 
        : null; // If null, user hasn't specified leagues, so show all leagues initially
    const favTeamsList = (favoriteTeams && typeof favoriteTeams === 'object')
        ? Object.values(favoriteTeams).flat().filter(Boolean) // Flatten and remove null/empty strings
        : []; // Default to empty array

    let filteredGames = gamesToFilter;
    if (preferredLeagues && preferredLeagues.length > 0) {
        filteredGames = filteredGames.filter(game => {
            // Add safety checks for game object and league property
            return game && typeof game.league === 'string' && preferredLeagues.includes(game.league.toUpperCase());
        });
    }


    if (favTeamsList.length > 0) {
        filteredGames = filteredGames.filter(game => {
            // Add safety check for game object
            if (!game) return false;
            const home = game.HomeTeam || game.homeTeam;
            const away = game.AwayTeam || game.awayTeam;
            // Check if home/away exist before includes
            return (home && favTeamsList.includes(home)) || (away && favTeamsList.includes(away));
        });
    }

    return Array.isArray(filteredGames) ? filteredGames : [];
};
// --- End Helper Functions ---

Deno.serve(async (req) => {
    // Authorization check
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
        console.error("[Edge Function] Unauthorized attempt.");
        return new Response('Unauthorized', { status: 401 });
    }

    console.log("[Edge Function] Starting weekly digest process...");

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const transporter = createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: Deno.env.get('MAILTRAP_USER')!,
                pass: Deno.env.get('MAILTRAP_PASS')!
            }
        });

        // --- Get All Upcoming Games Once ---
        const today = new Date();
        const startOfWeek = new Date(today); // Use current time
        const oneWeekFromNow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);

        const allSchedules = [
            ...(Array.isArray(nflSchedule) ? nflSchedule.map(g => ({ ...g, league: 'NFL' })) : []),
            ...(Array.isArray(nbaSchedule) ? nbaSchedule.map(g => ({ ...g, league: 'NBA' })) : []),
            ...(Array.isArray(mlbSchedule) ? mlbSchedule.map(g => ({ ...g, league: 'MLB' })) : []),
        ];
        console.log(`[Edge Function] Loaded ${allSchedules.length} total games.`);

        const allUpcomingGames = allSchedules.filter(game => {
             const gameDate = parseDate(game);
             if (isNaN(gameDate.getTime())) return false; // Check validity
             return gameDate >= startOfWeek && gameDate < oneWeekFromNow;
         }).sort((a, b) => {
             const dateA = parseDate(a);
             const dateB = parseDate(b);
             const timeA = !isNaN(dateA.getTime()) ? dateA.getTime() : Infinity;
             const timeB = !isNaN(dateB.getTime()) ? dateB.getTime() : Infinity;
             return timeA - timeB; 
         });

        console.log(`[Edge Function] Found ${allUpcomingGames.length} upcoming games this week.`);
        if (allUpcomingGames.length === 0) {
            console.log("[Edge Function] No upcoming games found.");
            return new Response("No upcoming games this week.", { status: 200 });
        }

        // --- Fetch All Subscribed Users with Preferences ---
        console.log("[Edge Function] Fetching subscribed users from Supabase...");
        const { data: usersData, error: userError } = await supabaseClient
            .from('users') 
            .select(`
              id,
              email,
              user_preferences (
                sports_prefs,
                favorite_teams
              )
            `) 
            .eq('notifications', true) 
            .eq('notify_frequency', 'weekly_mon') 
            .not('user_preferences', 'is', null); 

        if (userError) {
            console.error("[Edge Function] Supabase query error:", userError);
            throw userError; 
        }

        if (!usersData || usersData.length === 0) {
            console.log("[Edge Function] No users found matching the criteria.");
            return new Response("No users subscribed to weekly notifications.", { status: 200 });
        }
        console.log(`[Edge Function] Found ${usersData.length} subscribed users.`);

        let emailsSentCount = 0;
        for (const user of usersData) {
            // Ensure we have user email and preferences data
            if (!user.email) {
                console.warn(`[Edge Function] Skipping user ${user.id}: Missing email.`);
                continue;
            }
            // Preferences might be an array if multiple rows match (shouldn't happen with 1-to-1)
            // Or null if no preferences row exists (filtered by .not() above, but good practice to check)
            const prefs = user.user_preferences ? (Array.isArray(user.user_preferences) ? user.user_preferences[0] : user.user_preferences) : {};

            const userEmail = user.email;

            // Filter games based on this user's preferences
            const personalizedGames = filterGamesForUser(
                allUpcomingGames,
                prefs?.sports_prefs || null, 
                prefs?.favorite_teams || null 
            );

            // Skip email if the user has no relevant games this week
            if (personalizedGames.length === 0) {
                console.log(`[Edge Function] No relevant games for ${userEmail} this week. Skipping email.`);
                continue;
            }
            console.log(`[Edge Function] Found ${personalizedGames.length} personalized games for ${userEmail}.`);

            // --- Build Personalized Email Content ---
            let gamesHtml = "";
            let currentDay = "";
            for (const game of personalizedGames) {
                const gameDate = parseDate(game);
                if (isNaN(gameDate.getTime())) continue; 

                //const dateString = ymdLocal(gameDate.toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
                const dateString = gameDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

                if (dateString !== currentDay) {
                    currentDay = dateString;
                    gamesHtml += `
                      <li style="font-size: 16px; font-weight: 600; color: #E5E7EB; background-color: #1F2937; padding: 12px 16px; border-top: 1px solid #374151; margin-top: 16px; border-radius: 4px 4px 0 0;">
                        ${currentDay}
                      </li>
                    `;
                }

                const away = game.AwayTeam || game.awayTeam || "Away Team";
                const home = game.HomeTeam || game.homeTeam || "Home Team";
                gamesHtml += `
                  <li style="font-size: 15px; padding: 12px 16px; border-bottom: 1px solid #374151; background-color: #111827; display: flex; align-items: center; justify-content: space-between;">
                    <span style="color: #D1D5DB;">
                      <strong style="color: #F9FAFB; background-color: #374151; padding: 3px 6px; border-radius: 4px; font-size: 12px; margin-right: 8px;">${game.league || 'SPORT'}</strong>
                      ${away} at ${home}
                    </span>
                  </li>
                `;
            }

             const finalEmailHtml = `
               <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #111827;">
                 <table border="0" cellpadding="0" cellspacing="0" width="100%">
                   <tr>
                     <td style="padding: 20px 0;">
                       <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.4); background-color: #1F2937; color: #D1D5DB;">
                         <tr>
                           <td align="center" style="background-color: #0b1220; padding: 30px 20px; color: #ffffff;">
                             <h1 style="margin: 0; font-size: 28px; font-weight: 600; background: linear-gradient(135deg, #b91c1c); padding: 6px 12px;">Sports Predictor</h1>
                             <h2 style="margin: 10px 0 0; font-size: 20px; font-weight: 400; color: #9CA3AF;">Weekly Digest</h2>
                           </td>
                         </tr>
                         <tr>
                           <td style="padding: 40px 30px;">
                             <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #E5E7EB;">
                               Here are your games that you might be interested in for the upcoming week along with the latest sports news:
                             </p>
                             <ul style="margin: 0; padding: 0; list-style-type: none; border: 1px solid #374151; border-radius: 4px; overflow: hidden;">
                               ${gamesHtml}
                             </ul>
                             ${newsBlock}
                           </td>
                         </tr>
                         <tr>
                           <td align="center" style="background-color: #0b1220; padding: 30px 30px; border-top: 1px solid #374151;">
                             <p style="margin: 0; font-size: 12px; color: #6B7280;">
                               To change your notification settings, please visit your profile in the webapp.
                             </p>
                           </td>
                         </tr>
                       </table>
                     </td>
                   </tr>
                 </table>
               </body>
             `;

            try {
                await transporter.sendMail({
                  from: 'weekly-digest@sportspredictor.com', 
                  to: userEmail, 
                  subject: 'Your Personalized Weekly Game Schedule',
                  html: finalEmailHtml,
                });
                emailsSentCount++;
                console.log(`[Edge Function] Sent personalized digest to ${userEmail}`);
            } catch (emailError) {
                console.error(`[Edge Function] Failed to send email to ${userEmail}:`, emailError);
                // Optional: Implement retry logic or logging to a monitoring service
            }
        }

        console.log(`[Edge Function] Process complete. Sent ${emailsSentCount} emails out of ${usersData.length} subscribed users.`);
        return new Response(`Weekly digest sent to ${emailsSentCount} users out of ${usersData.length} subscribed.`, { status: 200 });

    } catch (error) {
        console.error("[Edge Function] Error processing weekly digest:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(`Error: ${errorMessage}`, { status: 500 });
    }


});