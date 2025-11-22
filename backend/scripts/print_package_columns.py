from decouple import config
import psycopg2

url=config('DATABASE_URL')
conn=psycopg2.connect(url)
cur=conn.cursor()
cur.execute("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='api_package';")
rows=cur.fetchall()
print('Columns for api_package:')
for r in rows:
    print(r)
cur.close(); conn.close()
