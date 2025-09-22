import http.client
from utility import complie_header

def main():
    # Follows the same api call structure a get_nfl.py
    conn = http.client.HTTPSConnection("v1.hockey.api-sports.io")

    headers = complie_header("v1.hockey.api-sports.io")

    conn.request("GET", "/leagues", headers=headers)

    res = conn.getresponse()
    data = res.read()

    # prints the response inorder to help with parsing it.
    print(data.decode("utf-8"))

if __name__ == "__main__":
    main()