import os
import django
import sys
from decouple import config
import psycopg2

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
# Ensure current path is first in sys.path
sys.path.insert(0, os.getcwd())
django.setup()

from django.apps import apps
from django.db import connection

DATABASE_URL = config('DATABASE_URL')

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

apps_to_check = ['api']

print('Checking models vs DB columns...')
for model in apps.get_models():
    if model._meta.app_label not in apps_to_check:
        continue
    table = model._meta.db_table
    # get model fields
    model_fields = [f.column for f in model._meta.concrete_fields]
    # get DB fields
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name=%s;", (table,))
    db_cols = [r[0] for r in cur.fetchall()]
    model_set = set(model_fields)
    db_set = set(db_cols)
    missing_in_db = model_set - db_set
    extra_in_db = db_set - model_set
    if missing_in_db or extra_in_db:
        print(f'\nModel: {model._meta.label} (table: {table})')
        if missing_in_db:
            print('  Fields missing in DB:', missing_in_db)
        if extra_in_db:
            print('  Extra columns in DB:', extra_in_db)
    else:
        print(f'\nModel: {model._meta.label} OK - fields match DB')

cur.close()
conn.close()
