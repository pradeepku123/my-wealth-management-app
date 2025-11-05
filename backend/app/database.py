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
    
    # Insert default users
    cursor.execute("""
        INSERT INTO users (user_id, password, full_name) 
        VALUES (%s, %s, %s), (%s, %s, %s)
        ON CONFLICT (user_id) DO NOTHING
    """, ("admin", "password123", "Admin User", "user1", "mypassword", "John Doe"))
    
    # Insert sample investments
    cursor.execute("""
        INSERT INTO investments (investment_type, fund_name, invested_amount, current_value) 
        VALUES 
            ('mutual_fund', 'SBI Bluechip Fund', 50000, 55000),
            ('epf', 'Company EPF Account', 75000, 78000),
            ('ppf', 'SBI PPF Account', 40000, 42000),
            ('fd', 'HDFC Bank FD', 100000, 105000)
        ON CONFLICT DO NOTHING
    """)
    
    conn.commit()
    cursor.close()
    conn.close()