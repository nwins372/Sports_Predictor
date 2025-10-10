import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./SportsPreference.css";

const all_sports = ["NFL", "NBA", "MLB", "College Sports"];

// Team data for each sport
const TEAM_DATA = {
  NFL: [
    "Buffalo Bills", "Miami Dolphins", "New York Jets", "New England Patriots",
    "Baltimore Ravens", "Cincinnati Bengals", "Pittsburgh Steelers", "Cleveland Browns",
    "Jacksonville Jaguars", "Tennessee Titans", "Indianapolis Colts", "Houston Texans",
    "Kansas City Chiefs", "Las Vegas Raiders", "Los Angeles Chargers", "Denver Broncos",
    "Philadelphia Eagles", "Dallas Cowboys", "New York Giants", "Washington Commanders",
    "Detroit Lions", "Green Bay Packers", "Minnesota Vikings", "Chicago Bears",
    "Tampa Bay Buccaneers", "New Orleans Saints", "Atlanta Falcons", "Carolina Panthers",
    "Los Angeles Rams", "Seattle Seahawks", "San Francisco 49ers", "Arizona Cardinals"
  ],
  NBA: [
    "Boston Celtics", "Miami Heat", "Milwaukee Bucks", "Philadelphia 76ers",
    "Brooklyn Nets", "New York Knicks", "Toronto Raptors", "Chicago Bulls",
    "Cleveland Cavaliers", "Detroit Pistons", "Indiana Pacers", "Atlanta Hawks",
    "Charlotte Hornets", "Orlando Magic", "Washington Wizards", "Denver Nuggets",
    "Minnesota Timberwolves", "Oklahoma City Thunder", "Portland Trail Blazers", "Utah Jazz",
    "Golden State Warriors", "Los Angeles Clippers", "Los Angeles Lakers", "Phoenix Suns",
    "Sacramento Kings", "Dallas Mavericks", "Houston Rockets", "Memphis Grizzlies",
    "New Orleans Pelicans", "San Antonio Spurs"
  ],
  MLB: [
    "Boston Red Sox", "New York Yankees", "Tampa Bay Rays", "Toronto Blue Jays",
    "Baltimore Orioles", "Chicago White Sox", "Cleveland Guardians", "Detroit Tigers",
    "Kansas City Royals", "Minnesota Twins", "Houston Astros", "Los Angeles Angels",
    "Oakland Athletics", "Seattle Mariners", "Texas Rangers", "Atlanta Braves",
    "Miami Marlins", "New York Mets", "Philadelphia Phillies", "Washington Nationals",
    "Chicago Cubs", "Cincinnati Reds", "Milwaukee Brewers", "Pittsburgh Pirates",
    "St. Louis Cardinals", "Arizona Diamondbacks", "Colorado Rockies", "Los Angeles Dodgers",
    "San Diego Padres", "San Francisco Giants"
  ],
  "College Sports": [
    "Alabama Crimson Tide", "Georgia Bulldogs", "Ohio State Buckeyes", "Michigan Wolverines",
    "Clemson Tigers", "Notre Dame Fighting Irish", "Oklahoma Sooners", "Texas Longhorns",
    "Florida Gators", "LSU Tigers", "Penn State Nittany Lions", "Wisconsin Badgers",
    "Oregon Ducks", "USC Trojans", "UCLA Bruins", "Stanford Cardinal",
    "North Carolina Tar Heels", "Duke Blue Devils", "Kentucky Wildcats", "Kansas Jayhawks"
  ]
};

export default function SportPrefsForm({ session }) {
  const [checked, setChecked] = useState([]);   
  const [selectedTeams, setSelectedTeams] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!session) return;
    const uid = session.user.id;

    (async () => {
      setLoading(true);
      setMsg("");

      // First try to select with favorite_teams column
      let { data, error } = await supabase
        .from("user_preferences")
        .select("sports_prefs, favorite_teams")
        .eq("user_id", uid)
        .maybeSingle();

      // If favorite_teams column doesn't exist, try without it
      if (error && error.message.includes('favorite_teams')) {
        console.log('favorite_teams column not found, falling back to sports_prefs only');
        const fallbackResult = await supabase
          .from("user_preferences")
          .select("sports_prefs")
          .eq("user_id", uid)
          .maybeSingle();
        
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        setMsg("Could not load preferences.");
        setChecked([]); 
        setSelectedTeams({});
      } else {
        const sportsArr = Array.isArray(data?.sports_prefs) ? data.sports_prefs : [];
        const teamsObj = data?.favorite_teams || {};
        setChecked(sportsArr);
        setSelectedTeams(teamsObj);
      }

      setLoading(false);
    })();
  }, [session]);

  const toggle = (sport) => {
    setChecked((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const toggleTeam = (sport, team) => {
    setSelectedTeams((prev) => {
      const currentTeams = prev[sport] || [];
      const isSelected = currentTeams.includes(team);
      
      if (isSelected) {
        // Remove team
        return {
          ...prev,
          [sport]: currentTeams.filter(t => t !== team)
        };
      } else {
        // Add team
        return {
          ...prev,
          [sport]: [...currentTeams, team]
        };
      }
    });
  };

  const save = async () => {
    if (!session) { setMsg("You must be logged in."); return; }
    setSaving(true);
    setMsg("");

    const uid = session.user.id;

    // First try to save with favorite_teams column
    let { error } = await supabase
      .from("user_preferences")
      .upsert(
        { 
          user_id: uid, 
          sports_prefs: checked,
          favorite_teams: selectedTeams
        }, 
        { onConflict: "user_id" }              
      );

    // If favorite_teams column doesn't exist, save without it
    if (error && error.message.includes('favorite_teams')) {
      console.log('favorite_teams column not found, saving sports_prefs only');
      const fallbackResult = await supabase
        .from("user_preferences")
        .upsert(
          { 
            user_id: uid, 
            sports_prefs: checked
          }, 
          { onConflict: "user_id" }              
        );
      error = fallbackResult.error;
      
      if (!error) {
        setMsg("Sports preferences saved. Team preferences require database update.");
      }
    }

    if (error) {
      setMsg(error.message || "Failed to save preferences.");
    } else if (!error) {
      setMsg("Preferences saved successfully!");
    }
    setSaving(false);
  };

  if (!session) return <p className="prefs-note">Log in to manage preferences.</p>;
  if (loading)    return <p className="prefs-note">Loading preferences…</p>;

  console.log("Rendering sports:", all_sports);
  
  return (
    <div className="prefs-card">
      <h2 className="prefs-title">Your Sports & Teams</h2>
      
      {/* Sports Selection */}
      <div className="prefs-section">
        <h3 className="prefs-subtitle">Sports</h3>
        <div className="prefs-grid">
          {all_sports.map((sport) => (
            <label key={sport} className="prefs-item">
              <input
                type="checkbox"
                checked={checked.includes(sport)}
                onChange={() => toggle(sport)}
              />
              <span>{sport}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Team Selection */}
      {checked.length > 0 && (
        <div className="prefs-section">
          <h3 className="prefs-subtitle">Favorite Teams</h3>
          {checked.map((sport) => (
            <div key={sport} className="team-section">
              <h4 className="team-sport-title">{sport}</h4>
              <div className="teams-grid">
                {TEAM_DATA[sport]?.map((team) => (
                  <label key={team} className="team-item">
                    <input
                      type="checkbox"
                      checked={selectedTeams[sport]?.includes(team) || false}
                      onChange={() => toggleTeam(sport, team)}
                    />
                    <span>{team}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="prefs-save-btn" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>

      {msg && <div className="prefs-msg">{msg}</div>}
    </div>
  );
}
