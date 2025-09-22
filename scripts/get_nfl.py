import os
import json
import http.client
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime
from utility import complie_header, get_teams


def main():
    # sets up a http connection to the specified api and then compiles the header for it.
    conn = http.client.HTTPSConnection("v1.american-football.api-sports.io")
    headers = complie_header("v1.american-football.api-sports.io")

    # Fetches the authentication infromation for supabase from an .env file and then 
    # uses it to create a client object for connecting to supabase.
    load_dotenv()
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_KEY')
    supabase = create_client(url, key)

    # Sends a get request to the leagues api and then waits for the response.
    conn.request('GET', f'/leagues', headers=headers)
    res = conn.getresponse()
    data = res.read()

    # For some reason the data can't be converted into json without 
    # being stored and retrived in a json file.
    with open(f'leagues_temp.json', 'w', encoding='utf-8') as f:
        f.write(str(data))

    with open(f'leagues_temp.json', 'r', encoding='utf-8') as f:
        text = f.readline()

    # Converts the response string into a dictionary using json.loads()
    dictionary = json.loads(text[2:-1])
    response = dictionary['response']

    # parses the response for the desired leagues infromation and stores it 
    # in the leagues table.
    for league in response:
        league_name = league['league']['name']
        response = (
            supabase.table('leagues')
                .upsert({
                    'sport': 'American Football',
                    'name': league_name,
                    'country': league['country']['name']
                })
                .execute()
        )
        # Gathers the combines seasons infromation from all the american football 
        # leagues into the seasons table.
        for season in league['seasons']:
            response = (
                supabase.table('seasons')
                    .upsert({
                        'year': season['year'],
                        'start': str(datetime.strptime(season['start'], "%Y-%m-%d").date()),
                        'end': str(datetime.strptime(season['end'], "%Y-%m-%d").date()),
                        'current': season['current'],
                        'leaguename': league_name
                    })
                    .execute()
            )
            # Only seasons 2021 - 2023 allowed for free trials
            if season['year'] in range(2021, 2024):
                get_teams(conn, headers, supabase, league['league']['id'], season['year'])

if __name__ == "__main__":
    main()