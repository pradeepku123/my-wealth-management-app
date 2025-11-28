from sqlalchemy import text
from app.db.session import engine

def migrate_goal_investments():
    with engine.connect() as connection:
        try:
            # Drop old association table
            connection.execute(text("DROP TABLE IF EXISTS goal_investments CASCADE;"))
            print("Dropped old goal_investments table.")
            
            # Create new association table
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS goal_investments_association (
                    goal_id INTEGER NOT NULL,
                    investment_id INTEGER NOT NULL,
                    allocated_amount NUMERIC(18, 2) DEFAULT 0,
                    PRIMARY KEY (goal_id, investment_id),
                    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
                    FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
                );
            """))
            print("Created new goal_investments_association table.")
            
            connection.commit()
        except Exception as e:
            print(f"Error migrating tables: {e}")
            connection.rollback()

if __name__ == "__main__":
    migrate_goal_investments()
