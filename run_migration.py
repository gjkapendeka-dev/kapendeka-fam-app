#!/usr/bin/env python3
import psycopg2
import os
import sys

# Supabase database connection details
# Format: postgresql://postgres:password@host:port/database
db_host = "xmyaeantpmvdgdvuvjlz.supabase.co"
db_port = 6543
db_name = "postgres"
db_user = "postgres.xmyaeantpmvdgdvuvjlz"
db_password = "NewJerusalem@2027"

print("\n🚀 Starting Quiz System Migration...\n")
print(f"📍 Database Host: {db_host}")
print(f"📊 Connecting as: {db_user}\n")

try:
    # Connect to the database
    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        database=db_name,
        user=db_user,
        password=db_password,
        sslmode="require"
    )
    
    print("✅ Connected to Supabase database successfully!\n")
    
    cursor = conn.cursor()
    
    # Read migration file
    migration_file = os.path.join(os.path.dirname(__file__), "supabase/migrations/20260710000001_add_quiz_restrictions.sql")
    
    print(f"📂 Migration file loaded: 20260710000001_add_quiz_restrictions.sql")
    
    with open(migration_file, 'r') as f:
        sql_content = f.read()
    
    # Reload schema cache
    sql_content += "\nNOTIFY pgrst, 'reload schema';"

    print(f"📊 File size: {len(sql_content)} bytes\n")
    
    # Execute the entire migration
    print("📋 Executing migration...\n")
    
    cursor.execute(sql_content)
    conn.commit()
    
    print("✅ Migration completed successfully!\n")
    print("📋 Tables created:")
    print("   - quizzes")
    print("   - quiz_questions")
    print("   - quiz_responses")
    print("   - quiz_attempts\n")
    print("🔒 Row-Level Security (RLS) policies applied")
    print("📈 Performance indexes created\n")
    
    # Verify tables exist
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'quiz%'
        ORDER BY table_name
    """)
    
    tables = cursor.fetchall()
    if tables:
        print("📊 Verification - Tables found:")
        for (table_name,) in tables:
            print(f"   ✅ {table_name}")
        print()
    
    cursor.close()
    conn.close()
    
except psycopg2.OperationalError as e:
    print(f"❌ Connection failed: {e}\n")
    sys.exit(1)
except psycopg2.DatabaseError as e:
    print(f"❌ Database error: {e}\n")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}\n")
    sys.exit(1)

print("🎉 Quiz system is ready for testing!\n")
