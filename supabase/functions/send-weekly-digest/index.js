import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend'

import nflSchedule from './nfl25.json' assert { type: 'json' }
import nbaSchedule from './nba25.json' assert { type: 'json' }
import mlbSchedule from './mlb25.json' assert { type: 'json' }


const parseDate = (game) => {
  const dateStr = game.DateUtc || game.DateUTC || game.dateUtc || game.date;
  return new Date(dateStr.replace(" ", "T"));
};

Deno.serve(async (req) => {
  // This function should only be called by the Supabase scheduler, secured by the service_role_key
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // 1. Upcoming games
    const today = new Date();
    const oneWeekFromNow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    
    const allSchedules = [
      ...nflSchedule.map(g => ({ ...g, league: 'NFL' })),
      ...nbaSchedule.map(g => ({ ...g, league: 'NBA' })),
      ...mlbSchedule.map(g => ({ ...g, league: 'MLB' })),
    ];

    const upcomingGames = allSchedules.filter(game => {
      const gameDate = parseDate(game);
      return gameDate >= today && gameDate <= oneWeekFromNow;
    }).sort((a, b) => parseDate(a) - parseDate(b));

    if (upcomingGames.length === 0) {
      return new Response("No upcoming games this week.", { status: 200 });
    }

    // 2. search for subscribed users
    const { data: users, error: userError } = await supabaseClient
      .from('users')
      .select('email')
      .eq('notifications', true)
      .eq('notify_frequency', 'weekly_mon');

    if (userError) throw userError;
    if (!users || users.length === 0) {
      return new Response("No users subscribed to weekly notifications.", { status: 200 });
    }

    // Construct and send emails
    const gamesHtml = upcomingGames.map(game => {
      const gameDate = parseDate(game);
      const dateString = gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const away = game.AwayTeam || game.awayTeam;
      const home = game.HomeTeam || game.homeTeam;
      return `<li><strong>${game.league}:</strong> ${away} at ${home} on ${dateString}</li>`;
    }).join('');

    const emailHtml = `
      <h1>Your Weekly Game Schedule</h1>
      <p>Here are the games coming up in the next 7 days:</p>
      <ul>${gamesHtml}</ul>
      <p>To change your notification settings, please visit your profile in the app.</p>
    `;
    
    await resend.emails.send({
      from: 'weeklynews@sportspredictor.com',
      to: users.map(u => u.email),
      subject: 'Your Upcoming Weekly Game Schedule',
      html: emailHtml,
    });

    return new Response(`Weekly digest sent to ${users.length} users.`, { status: 200 });

  } catch (error) {
    console.error(error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});