#!/usr/bin/env python3
import psycopg2
import os
import sys

db_host = "xmyaeantpmvdgdvuvjlz.supabase.co"
db_port = 6543
db_name = "postgres"
db_user = "postgres.xmyaeantpmvdgdvuvjlz"
db_password = "NewJerusalem@2027"

try:
    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        database=db_name,
        user=db_user,
        password=db_password,
        sslmode="require"
    )
    cursor = conn.cursor()
    migration_file = os.path.join(os.path.dirname(__file__), "supabase/migrations/20260715181601_add_is_archived_to_quizzes.sql")
    with open(migration_file, 'r') as f:
        sql_content = f.read()
    
    sql_content += "\nNOTIFY pgrst, 'reload schema';"
    cursor.execute(sql_content)
    conn.commit()
    print("Migration 20260715181601_add_is_archived_to_quizzes.sql executed successfully.")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
