import os
import json
import requests
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime
from postgrest.exceptions import APIError
from utility import complie_header, null_check

Seasoned = []

def main():
    # Fetches the authentication infromation for supabase from an .env file and then 
    # uses it to create a client object for connecting to supabase.
    load_dotenv()
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_KEY')
    supabase = create_client(url, key)

    # Sends a get request to the leagues api and then waits for the response.
    for sport, league in [('football', 'nfl'), ('basketball', 'nba'), ('baseball', 'mlb')]:
        base_url = f'https://sports.core.api.espn.com/v2/sports/{sport}/leagues/{league}'
        teams_data = requests.get(base_url + '/teams')
        players_data = requests.get(base_url + '/athletes')

        for year in range(2020, 2026):
            season_url = base_url + f'/seasons/{year}'
            season_data = requests.get(season_url)
            season_dict = json.loads(season_data.text)
            response = (
                supabase.table('seasons')
                    .upsert({
                        'year': season_dict['year'],
                        'startdate': str(datetime.strptime(season_dict['startDate'][:10], "%Y-%m-%d").date()),
                        'enddate': str(datetime.strptime(season_dict['endDate'][:10], "%Y-%m-%d").date())
                    })
                    .execute()
            )

            season_teams_data = requests.get(season_url + '/teams')
            season_teams_dict = json.loads(season_teams_data.text)
            season_teams = season_teams_dict['items']
            for season_team in season_teams:
                season_team_data = requests.get(season_team['$ref'])
                season_team_dict = json.loads(season_team_data.text)
                Seasoned.append((season_team_dict['id'], year))
            

        # Converts the response string into a dictionary using json.loads()
        teams_dict = json.loads(teams_data.text)
        items = teams_dict['items']

        # parses the response for the desired team infromation and stores it 
        # in the teams table.
        for team in items:
            team_data = requests.get(team['$ref'])
            team_dict = json.loads(team_data.text)
            team_name = null_check('name', team_dict)

            response = (
                supabase.table('teams')
                    .upsert({
                        'id': team_dict['id'],
                        'league': league,
                        'name': team_name,
                        'color': null_check('color', team_dict),
                        # 'record': null_check('record', team_dict, True),
                        # 'venue': null_check('venue', team_dict, True),
                        # 'groups': null_check('groups', team_dict, True),
                        # 'ranks': null_check('ranks', team_dict, True),
                        # 'statistics': null_check('statistics', team_dict, True),
                        # 'leaders': null_check('leaders', team_dict, True),
                        # 'links': null_check('links', team_dict),
                        # 'injuries': null_check('injuries', team_dict, True),
                        # 'notes': null_check('notes', team_dict, True),
                        # 'againstthespreadrecords': null_check('againstTheSpreadRecords', team_dict, True),
                        # 'franchise': null_check('franchise', team_dict, True),
                        # 'events': null_check('events', team_dict, True),
                        # 'transactions': null_check('transactions', team_dict, True),
                        # 'coaches': null_check('coaches', team_dict, True),
                        # 'attendance': null_check('attendance', team_dict, True)
                    })
                    .execute()
            )

            if team_dict['id'] in [s[0] for s in Seasoned if s[0] == team_dict['id']]:
                response = (
                    supabase.table('seasonteams')
                        .upsert({
                            'teams_id': team_dict['id'],
                            'league': league,
                            'year': year
                        })
                        .execute()
                )
        
        # Converts the response string into a dictionary using json.loads()
        players_dict = json.loads(players_data.text)
        items = players_dict['items']

        # parses the response for the desired team infromation and stores it 
        # in the teams table.
        for player in items:
            player_data = requests.get(player['$ref'])
            player_dict = json.loads(player_data.text)

            response = (
                supabase.table('players')
                    .upsert({
                        'id': player_dict['id'],
                        'sport': player_dict['type'],
                        'fullname': player_dict['fullName'],
                        'weight': null_check('weight', player_dict),
                        'height': null_check('height', player_dict),
                        'age': null_check('age', player_dict),
                        'dob': null_check('dateOfBirth', player_dict),
                        'debuteyear': null_check('debuteYear', player_dict),
                        'links': null_check('links', player_dict),
                        'birthplace': null_check('birthplace', player_dict),
                        'college': null_check('college', player_dict, True),
                        'jersey': null_check('jersey', player_dict),
                        'position': null_check('abbreviation', player_dict, seq='position'),
                        'injuries': null_check('injuries', player_dict, True),
                        'statistics': null_check('statistics', player_dict, True),
                        'notes': null_check('notes', player_dict, True),
                        'contracts': null_check('contracts', player_dict, True),
                        'experience': f'{null_check('experience', player_dict)} years',
                        'collegeathlete': null_check('collegeAthlete', player_dict, True),
                        'active': null_check('active', player_dict),
                        'eventlog': null_check('eventLog', player_dict, True),
                        'status': null_check('name', player_dict, seq='status')
                    })
                    .execute()
            )
            draft_team = null_check('team', player_dict, True, seq='draft')
            if draft_team == None:
                continue
            draft_team = json.loads(draft_team)
            try:
                response = (
                    supabase.table('drafts')
                        .upsert({
                            'league': league,
                            'year': year,
                            'teamid': draft_team['id'],
                            'playerid': player_dict['id'],
                            'round': null_check('round', player_dict, seq='draft'),
                            'selection': null_check('selection', player_dict, seq='draft')

                        })
                        .execute()
                )
            except APIError:
                continue

if __name__ == "__main__":
    main()