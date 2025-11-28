from sqlalchemy import text
from app.db.session import engine

def fix_schema():
    with engine.connect() as connection:
        # Fix Goals table
        try:
            connection.execute(text("ALTER TABLE goals ALTER COLUMN target_amount TYPE NUMERIC(18, 2);"))
            connection.execute(text("ALTER TABLE goals ALTER COLUMN monthly_sip_amount TYPE NUMERIC(18, 2);"))
            print("Updated goals table schema.")
        except Exception as e:
            print(f"Error updating goals table: {e}")

        # Fix Investments table
        try:
            connection.execute(text("ALTER TABLE investments ALTER COLUMN invested_amount TYPE NUMERIC(18, 2);"))
            connection.execute(text("ALTER TABLE investments ALTER COLUMN current_value TYPE NUMERIC(18, 2);"))
            print("Updated investments table schema.")
        except Exception as e:
            print(f"Error updating investments table: {e}")
            
        connection.commit()

if __name__ == "__main__":
    fix_schema()
