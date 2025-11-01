import os
import sys
import json
import requests
from dotenv import load_dotenv

load_dotenv()

MAPS_API_URL = "https://maps.googleapis.com/maps/api"
MAPS_API_KEY = os.getenv("REACT_APP_GOOGLE_MAPS_API_KEY")

def search_local_sports_venues(address):
    '''
    Searches for sports venues near a given address using the Google Maps API.

    Parameters:
        address (str): The address to search near.
    Returns:
        list: A list of sports venues found near the address.
    '''
    geocode_url = f"{MAPS_API_URL}/geocode/json"
    params = {
        "address": address,
        "key": MAPS_API_KEY
    }
    geocode_response = requests.get(geocode_url, params=params)
    geocode_data = geocode_response.json()
    if geocode_data['status'] != 'OK':
        return []

    location = geocode_data['results'][0]['geometry']['location']
    lat = location['lat']
    lng = location['lng']

    # Search for sports venues near the geocoded location
    places_url = f"{MAPS_API_URL}/places/nearbysearch/json"
    places_params = {
        "location": f"{lat},{lng}",
        "radius": 5000,  # Search within 5km
        "type": "stadium",
        "key": MAPS_API_KEY
    }
    places_response = requests.get(places_url, params=places_params)
    if places_response.status_code == 200:
        places_data = places_response.json()
        if places_data["results"]:
            return places_data["results"]
    return []

def create_json_file(data, filename):
    '''
    Creates a JSON file from the provided data.

    Parameters:
        data (dict or list): The data to write to the JSON file.
        filename (str): The name of the file to create.
    '''
    root_folder = os.path.dirname(os.path.abspath(__file__))
    path = root_folder + 'src/assets/' + filename
    with open(path, 'w') as json_file:
        json.dump(data, json_file, indent=4)

def main(address):
    venues = search_local_sports_venues(address)
    if venues:
        create_json_file(venues, 'local_sports_venues.json')
        print(f"Found {len(venues)} venues. Data written to local_sports_venues.json")
    else:
        print("No sports venues found near the given address.")

if __name__ == "__main__":
    args = sys.argv
    if len(args) != 2:
        print("Usage: python maps_api.py <address>")
    else:
        main(args[1])