from dotenv import load_dotenv
import requests
import json
import os

# Global list for preventing unneccessary upsert operations on exsisting teams.
CHEAKED_TEAMS = []

def complie_header(host: str) -> dict:
    '''A function that builds the authentication part of the header for all of the api calls.'''
    load_dotenv()
    headers = {
        'x-rapidapi-host': host,
        'x-rapidapi-key': os.getenv('API_KEY')
        }
    
    return headers

def null_check(vars: str, d: dict, request: bool = False, seq: str = ''):
    '''
    A function for handeling apostrophes in order to allow the string to be converted to json. 
    Depending on the encode parameter the function will either replace all apostrophes 
    with placeholders or replace the placeholders with apostrophes. If it encounters a null
    character it will instead just return the string.
    '''
    try:
        if seq != '':
            d = d[seq]

        if request:
            output = requests.get(d[vars]['$ref']).text
        elif vars == 'birthplace':
            output = f'{d[vars]['city']}, {d[vars]['state']}, {d[vars]['country']}'
        else:
            output = d[vars]
        
        if output == []:
            return None
        else:
            return output
    except KeyError:
        return None


def get_teams(conn, headers, supabase, id, year):
    '''A function that gets teams based on league and season.'''
    # Sending a request works the same way for teams as for leagues except teams 
    # requires the id of a league and the year of a season.
    conn.request('GET', f'/teams?league={id}&season={year}', headers=headers)
    res = conn.getresponse()
    data = res.read()

    # For some reason the data can't be converted into json without 
    # being stored and retrived in a json file.
    with open(f'teams_temp.json', 'w', encoding='utf-8') as f:
        f.write(str(data))

    with open(f'teams_temp.json', 'r', encoding='utf-8') as f:
        text = f.readline()
    
    # Converts the response string into a dictionary using json.loads()
    dictionary = json.loads(deapostrophy(text[2:-1], True))
    response = dictionary['response']
    
    for team in response:
        name = deapostrophy(team['name'])
        if name not in CHEAKED_TEAMS and name is not None:
            CHEAKED_TEAMS.append(name)
            # Stores the specified infromaton in the teams table in supabase.
            response = (
                supabase.table('teams')
                    .upsert({
                        'sport': 'American Football',
                        'name': deapostrophy(team['name']),
                        'country': team['country']['name'],
                        'city': team['city'],
                        'coach': deapostrophy(team['coach']),
                        'owner': deapostrophy(team['owner']),
                        'stadium': deapostrophy(team['stadium']),
                        'established': team['established']
                    })
                    .execute()
            )