from decouple import config
import psycopg2

url=config('DATABASE_URL')
conn=psycopg2.connect(url)
cur=conn.cursor()
cur.execute("SELECT app, name, applied FROM django_migrations WHERE app='api' ORDER BY applied ASC;")
rows=cur.fetchall()
for r in rows:
    print(r[0], r[1], r[2])
cur.close(); conn.close()
