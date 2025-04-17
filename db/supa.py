from dotenv import load_dotenv
import psycopg2
import os
from supabase import create_client, Client

def main():

    try:
        load_dotenv()

        USER = os.getenv("user")
        PASSWORD = input("ENTER THE PASSWORD NOW: ")
        HOST = os.getenv("host")
        PORT = os.getenv("port")
        DBNAME = os.getenv("dbname")

        conn = psycopg2.connect(
            user=USER,
            password=PASSWORD,
            host=HOST,
            port=PORT,
            dbname=DBNAME
        )
        print("Connection successful!")
        
        cursor = conn.cursor()
        player_name1 = input("Enter player name to insert: ")
        player_sport1 = input("Enter that player's sport: ")
        sample_data = [
            (player_name1, player_sport1),
        ]

        insert_query = """
        INSERT INTO sample_data (player_name, player_sport)
        VALUES (%s, %s)
        """

        cursor.executemany(insert_query, sample_data)
        conn.commit()

        print("Sample data inserted!")

        # Cleanup
        cursor.close()
        conn.close()

        read_sample_table()

    except Exception as e:
        print(f"Issue: {e}")

def read_sample_table():
    load_dotenv()

    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_KEY")

    supabase: Client = create_client(url, key)
    print("READING FROM SAMPLE DATA TABLE:")
    response = supabase.table("sample_data").select("*").execute()

    print(response)
    
if __name__ == "__main__":
    print("Setup and Demo of Environment:\n")
    main()
    
