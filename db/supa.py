from dotenv import load_dotenv
import psycopg2
import random
import os
from supabase import create_client, Client

def unique_id():
    """
    Generate a unique ID.
    """
    seed = random.getrandbits(32)
    while True:
        yield seed
        seed += 1

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
        users_user_id = next(unique_id())
        users_name = input("Enter your name: ")
        users_email = input("Enter your email: ")
        users_username = input("Enter your username: ")
        users_password = input("Enter your password: ")
        users_notifications = input("Do you want notifications? (yes/no): ")
        users_notifications = True if users_notifications.lower() == 'yes' else False
        users_notifications_interval = input("Enter notification interval (in minutes): ")
        sample_data = [
            (users_user_id, users_name, users_email, users_password, users_username, users_notifications, users_notifications_interval),
        ]

        insert_query = """
        INSERT INTO users (userid, name, email, password, username, notificationtoggle, notificationinterval)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
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
    response = supabase.table("users").select("*").execute()

    print(response)
    
if __name__ == "__main__":
    print("Setup and Demo of Environment:\n")
    main()
