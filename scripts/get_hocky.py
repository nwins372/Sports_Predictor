import http.client
from utility import complie_header

def main():
    conn = http.client.HTTPSConnection("v1.hockey.api-sports.io")

    headers = complie_header("v1.hockey.api-sports.io")

    conn.request("GET", "/leagues", headers=headers)

    res = conn.getresponse()
    data = res.read()

    print(data.decode("utf-8"))

if __name__ == "__main__":
    main()