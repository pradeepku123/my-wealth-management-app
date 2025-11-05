"""Database configuration."""
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_CONFIG = {
    "host": "db",
    "database": "wealth_db",
    "user": "postgres",
    "password": "examplepassword",
    "port": "5432"
}

def get_db_connection():
    """Get database connection."""
    return psycopg2.connect(**DATABASE_CONFIG, cursor_factory=RealDictCursor)

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
    
    # Insert default users
    cursor.execute("""
        INSERT INTO users (user_id, password, full_name) 
        VALUES (%s, %s, %s), (%s, %s, %s)
        ON CONFLICT (user_id) DO NOTHING
    """, ("admin", "password123", "Admin User", "user1", "mypassword", "John Doe"))
    
    conn.commit()
    cursor.close()
    conn.close()