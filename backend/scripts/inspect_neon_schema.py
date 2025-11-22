from decouple import config
import psycopg2

DATABASE_URL = config('DATABASE_URL')
print('DB URL:', DATABASE_URL)

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
print('Tables:')
for t in cur.fetchall():
    print(' -', t[0])

# Example: list columns from a few known tables
tables_to_check = ['api_shop', 'api_product', 'api_order', 'api_shoppingreceip', 'api_productbuyed', 'api_productreceived', 'api_expectedmetrics', 'django_migrations']
for tbl in tables_to_check:
    try:
        cur.execute("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name=%s;", (tbl,))
        cols = cur.fetchall()
        print('\nColumns for', tbl)
        for c in cols:
            print('  ', c)
    except Exception as e:
        print('Error reading', tbl, e)

cur.close()
conn.close()

def print_constraints_and_indexes(conn, tbl):
    cur = conn.cursor()
    print('\nConstraints for', tbl)
    cur.execute("SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name=%s;", (tbl,))
    for r in cur.fetchall():
        print('  ', r)
    print('\nIndexes for', tbl)
    cur.execute("SELECT indexname, indexdef FROM pg_indexes WHERE tablename=%s;", (tbl,))
    for r in cur.fetchall():
        print('  ', r)
    cur.close()

conn = None
try:
    import psycopg2
    conn = psycopg2.connect(DATABASE_URL)
    for t in ['api_product', 'api_productbuyed', 'api_shoppingreceip', 'api_expectedmetrics']:
        print_constraints_and_indexes(conn, t)
finally:
    if conn:
        conn.close()
