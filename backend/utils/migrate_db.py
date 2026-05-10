import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'instance', 'intellihire.db')

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check existing columns
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'full_name' not in columns:
            print("Adding full_name column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN full_name VARCHAR(100)")
            
        if 'is_admin' not in columns:
            print("Adding is_admin column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
            
        # Drop old tables to start fresh with unified schema
        print("Unifying question tables...")
        cursor.execute("DROP TABLE IF EXISTS company_questions")
        cursor.execute("DROP TABLE IF EXISTS question_bank")
        
        # Create unified question_bank table
        cursor.execute("""
            CREATE TABLE question_bank (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category VARCHAR(50) NOT NULL,
                domain VARCHAR(100),
                difficulty VARCHAR(20),
                question_text TEXT NOT NULL,
                question_type VARCHAR(50),
                subtype VARCHAR(50),
                requires_code BOOLEAN DEFAULT 0,
                company_name VARCHAR(100),
                is_verified BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Unified question_bank table created.")
            
        conn.commit()
        conn.close()
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Error during migration: {e}")
