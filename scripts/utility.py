from dotenv import load_dotenv
import requests
import json
import os

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