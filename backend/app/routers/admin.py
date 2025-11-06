"""Database administration routes."""
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from app.database import get_db_connection
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["database-admin"])


@router.get("/tables", response_model=List[Dict[str, Any]], responses={
    500: {"description": "Internal server error"}
})
def get_tables():
    """
    Get list of all database tables.
    
    Returns information about all tables in the database including:
    - Table name
    - Row count
    - Table size information
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get table information
        cursor.execute("""
            SELECT 
                table_name,
                (SELECT COUNT(*) FROM information_schema.columns 
                 WHERE table_name = t.table_name AND table_schema = 'public') as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        
        tables = []
        for table in cursor.fetchall():
            table_name = table['table_name']
            
            # Get row count for each table
            cursor.execute(f'SELECT COUNT(*) as row_count FROM "{table_name}"')
            row_count = cursor.fetchone()['row_count']
            
            tables.append({
                "table_name": table_name,
                "column_count": table['column_count'],
                "row_count": row_count
            })
        
        cursor.close()
        conn.close()
        return tables
        
    except Exception as e:
        logger.error(f"Get tables error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve table information"
        )


@router.get("/tables/{table_name}/schema", response_model=List[Dict[str, Any]], responses={
    404: {"description": "Table not found"},
    500: {"description": "Internal server error"}
})
def get_table_schema(table_name: str):
    """
    Get schema information for a specific table.
    
    Returns detailed column information including:
    - Column name
    - Data type
    - Nullable status
    - Default values
    - Primary key information
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("""
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = %s
        """, (table_name,))
        
        if cursor.fetchone()['count'] == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table '{table_name}' not found"
            )
        
        # Get column information
        cursor.execute("""
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length,
                numeric_precision,
                numeric_scale
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
        """, (table_name,))
        
        columns = cursor.fetchall()
        
        # Get primary key information
        cursor.execute("""
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public'
                AND tc.table_name = %s
        """, (table_name,))
        
        primary_keys = [row['column_name'] for row in cursor.fetchall()]
        
        # Add primary key info to columns
        result = []
        for col in columns:
            column_info = dict(col)
            column_info['is_primary_key'] = col['column_name'] in primary_keys
            result.append(column_info)
        
        cursor.close()
        conn.close()
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get table schema error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve table schema"
        )


@router.get("/tables/{table_name}/data", response_model=Dict[str, Any], responses={
    404: {"description": "Table not found"},
    500: {"description": "Internal server error"}
})
def get_table_data(table_name: str, limit: int = 100, offset: int = 0):
    """
    Get data from a specific table with pagination.
    
    Returns table data with metadata:
    - **table_name**: Name of the table
    - **limit**: Number of records per page (max 1000)
    - **offset**: Starting record number
    - **total_count**: Total number of records
    - **data**: Array of table records
    """
    try:
        # Validate limit
        if limit > 1000:
            limit = 1000
        if limit < 1:
            limit = 10
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("""
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = %s
        """, (table_name,))
        
        if cursor.fetchone()['count'] == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table '{table_name}' not found"
            )
        
        # Get total count
        cursor.execute(f'SELECT COUNT(*) as total FROM "{table_name}"')
        total_count = cursor.fetchone()['total']
        
        # Get paginated data
        cursor.execute(f'SELECT * FROM "{table_name}" LIMIT %s OFFSET %s', (limit, offset))
        data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "table_name": table_name,
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "data": data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get table data error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve table data"
        )


@router.get("/database/stats", response_model=Dict[str, Any], responses={
    500: {"description": "Internal server error"}
})
def get_database_stats():
    """
    Get overall database statistics.
    
    Returns comprehensive database information:
    - Database name and version
    - Total number of tables
    - Total number of records across all tables
    - Database size information
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get PostgreSQL version
        cursor.execute("SELECT version()")
        version = cursor.fetchone()['version']
        
        # Get database name
        cursor.execute("SELECT current_database()")
        db_name = cursor.fetchone()['current_database']
        
        # Get table count
        cursor.execute("""
            SELECT COUNT(*) as table_count 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        """)
        table_count = cursor.fetchone()['table_count']
        
        # Get total records across all tables
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        """)
        tables = cursor.fetchall()
        
        total_records = 0
        table_details = []
        
        for table in tables:
            table_name = table['table_name']
            cursor.execute(f'SELECT COUNT(*) as count FROM "{table_name}"')
            count = cursor.fetchone()['count']
            total_records += count
            
            table_details.append({
                "table_name": table_name,
                "record_count": count
            })
        
        cursor.close()
        conn.close()
        
        return {
            "database_name": db_name,
            "postgresql_version": version.split()[1] if version else "Unknown",
            "total_tables": table_count,
            "total_records": total_records,
            "tables": table_details
        }
        
    except Exception as e:
        logger.error(f"Get database stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve database statistics"
        )


@router.delete("/tables/{table_name}/data/{record_id}", responses={
    404: {"description": "Record not found"},
    500: {"description": "Internal server error"}
})
def delete_record(table_name: str, record_id: int):
    """
    Delete a record from the specified table.
    
    **Warning:** This permanently deletes data from the database.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get primary key column name
        cursor.execute("""
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public'
                AND tc.table_name = %s
            LIMIT 1
        """, (table_name,))
        
        pk_result = cursor.fetchone()
        if not pk_result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table has no primary key"
            )
        
        pk_column = pk_result['column_name']
        
        # Delete the record
        cursor.execute(f'DELETE FROM "{table_name}" WHERE "{pk_column}" = %s', (record_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Record not found"
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"message": f"Record {record_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete record error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete record"
        )


@router.put("/tables/{table_name}/data/{record_id}", responses={
    404: {"description": "Record not found"},
    500: {"description": "Internal server error"}
})
def update_record(table_name: str, record_id: int, data: Dict[str, Any]):
    """
    Update a record in the specified table.
    
    **Request Body:** JSON object with column names as keys and new values.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get primary key column name
        cursor.execute("""
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public'
                AND tc.table_name = %s
            LIMIT 1
        """, (table_name,))
        
        pk_result = cursor.fetchone()
        if not pk_result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table has no primary key"
            )
        
        pk_column = pk_result['column_name']
        
        # Build update query
        if not data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No data provided for update"
            )
        
        # Remove primary key from update data if present
        update_data = {k: v for k, v in data.items() if k != pk_column}
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No updatable fields provided"
            )
        
        set_clause = ', '.join([f'"{col}" = %s' for col in update_data.keys()])
        values = list(update_data.values()) + [record_id]
        
        cursor.execute(
            f'UPDATE "{table_name}" SET {set_clause} WHERE "{pk_column}" = %s',
            values
        )
        
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Record not found"
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"message": f"Record {record_id} updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update record error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update record"
        )