"""Database configuration."""
import psycopg2
from psycopg2.extras import RealDictCursor
import time

DATABASE_CONFIG = {
    "host": "db",
    "database": "wealth_db",
    "user": "postgres",
    "password": "examplepassword",
    "port": "5432"
}

def get_db_connection():
    """Get database connection with retry."""
    max_retries = 30
    for attempt in range(max_retries):
        try:
            return psycopg2.connect(**DATABASE_CONFIG, cursor_factory=RealDictCursor)
        except psycopg2.OperationalError:
            if attempt < max_retries - 1:
                time.sleep(1)
                continue
            raise

def init_database():
    """Initialize database tables."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create investments table (renamed from mutual_funds)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS investments (
            id SERIAL PRIMARY KEY,
            investment_type VARCHAR(50) NOT NULL,
            fund_name VARCHAR(255) NOT NULL,
            invested_amount DECIMAL(15,2) NOT NULL,
            current_value DECIMAL(15,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create mutual_funds table for NAV data
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mutual_funds (
            id SERIAL PRIMARY KEY,
            scheme_code VARCHAR(20) UNIQUE NOT NULL,
            scheme_name VARCHAR(500) NOT NULL,
            nav DECIMAL(10,4) NOT NULL,
            nav_date VARCHAR(20) NOT NULL,
            fund_house VARCHAR(200),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Add role column to users table if it doesn't exist
    cursor.execute("""
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'
    """)
    
    # Add email column to users table if it doesn't exist
    cursor.execute("""
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100)
    """)
    
    # Insert default users
    cursor.execute("""
        INSERT INTO users (user_id, password, full_name, role) 
        VALUES (%s, %s, %s, %s), (%s, %s, %s, %s)
        ON CONFLICT (user_id) DO NOTHING
    """, ("admin", "superadmin", "Admin User", "admin", "user1", "admin", "John Doe", "user"))
    

    
    conn.commit()
    cursor.close()
    conn.close()