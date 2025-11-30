"""Database administration routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from app import models
from app.api import deps
from app.schemas.response import APIResponse
from app.utils.response import success_response, error_response
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/tables", response_model=APIResponse, responses={
    500: {"description": "Internal server error"}
}, dependencies=[Depends(deps.get_current_active_superuser)])
def get_tables(db: Session = Depends(deps.get_db)):
    """
    Get list of all database tables.
    
    Returns information about all tables in the database including:
    - Table name
    - Row count
    - Table size information
    """
    try:
        # Get table information
        result = db.execute(text("""
            SELECT 
                table_name,
                (SELECT COUNT(*) FROM information_schema.columns 
                 WHERE table_name = t.table_name AND table_schema = 'public') as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """))
        
        tables = []
        for row in result:
            table_name = row.table_name
            
            # Get row count for each table
            row_count_result = db.execute(text(f'SELECT COUNT(*) as row_count FROM "{table_name}"')).fetchone() # nosec
            row_count = row_count_result.row_count
            
            tables.append({
                "table_name": table_name,
                "column_count": row.column_count,
                "row_count": row_count
            })
        
        return success_response(data=tables, message="Database tables retrieved successfully")
        
    except Exception as e:
        logger.error(f"Get tables error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve table information"
        )


@router.get("/tables/{table_name}/schema", response_model=APIResponse, responses={
    404: {"description": "Table not found"},
    500: {"description": "Internal server error"}
}, dependencies=[Depends(deps.get_current_active_superuser)])
def get_table_schema(table_name: str, db: Session = Depends(deps.get_db)):
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
        # Check if table exists
        result = db.execute(text("""
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = :table_name
        """), {'table_name': table_name})
        
        if result.scalar() == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table '{table_name}' not found"
            )
        
        # Get column information
        columns_result = db.execute(text("""
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length,
                numeric_precision,
                numeric_scale
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = :table_name
            ORDER BY ordinal_position
        """), {'table_name': table_name})
        
        columns = columns_result.fetchall()
        
        # Get primary key information
        pk_result = db.execute(text("""
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public'
                AND tc.table_name = :table_name
        """), {'table_name': table_name})
        
        primary_keys = [row.column_name for row in pk_result]
        
        # Add primary key info to columns
        result = []
        for col in columns:
            column_info = dict(col._mapping)
            column_info['is_primary_key'] = col.column_name in primary_keys
            result.append(column_info)
        
        return success_response(data=result, message=f"Schema for table '{table_name}' retrieved successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get table schema error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve table schema"
        )


@router.get("/tables/{table_name}/data", response_model=APIResponse, responses={
    404: {"description": "Table not found"},
    500: {"description": "Internal server error"}
}, dependencies=[Depends(deps.get_current_active_superuser)])
def get_table_data(table_name: str, limit: int = 100, offset: int = 0, db: Session = Depends(deps.get_db)):
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
            
        # Check if table exists
        result = db.execute(text("""
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = :table_name
        """), {'table_name': table_name})
        
        if result.scalar() == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table '{table_name}' not found"
            )
        
        # Get total count
        total_count_result = db.execute(text(f'SELECT COUNT(*) as total FROM "{table_name}"')).scalar() # nosec
        
        # Get paginated data
        data_result = db.execute(text(f'SELECT * FROM "{table_name}" LIMIT :limit OFFSET :offset'), {'limit': limit, 'offset': offset}) # nosec
        data = [dict(row._mapping) for row in data_result]
        
        return success_response(
            data={
                "table_name": table_name,
                "total_count": total_count_result,
                "limit": limit,
                "offset": offset,
                "data": data
            },
            message=f"Data from table '{table_name}' retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get table data error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve table data"
        )


@router.get("/database/stats", response_model=APIResponse, responses={
    500: {"description": "Internal server error"}
}, dependencies=[Depends(deps.get_current_active_superuser)])
def get_database_stats(db: Session = Depends(deps.get_db)):
    """
    Get overall database statistics.
    
    Returns comprehensive database information:
    - Database name and version
    - Total number of tables
    - Total number of records across all tables
    - Database size information
    """
    try:
        # Get PostgreSQL version
        version_result = db.execute(text("SELECT version()")).scalar()
        
        # Get database name
        db_name_result = db.execute(text("SELECT current_database()")).scalar()
        
        # Get table count
        table_count_result = db.execute(text("""
            SELECT COUNT(*) as table_count 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        """)).scalar()
        
        # Get total records across all tables
        tables_result = db.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        """))
        
        total_records = 0
        table_details = []
        
        for row in tables_result:
            table_name = row.table_name
            count_result = db.execute(text(f'SELECT COUNT(*) as count FROM "{table_name}"')).scalar() # nosec
            total_records += count_result
            
            table_details.append({
                "table_name": table_name,
                "record_count": count_result
            })
        
        return success_response(
            data={
                "database_name": db_name_result,
                "postgresql_version": version_result.split()[1] if version_result else "Unknown",
                "total_tables": table_count_result,
                "total_records": total_records,
                "tables": table_details
            },
            message="Database statistics retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Get database stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve database statistics"
        )


@router.delete("/tables/{table_name}/data/{record_id}", responses={
    404: {"description": "Record not found"},
    500: {"description": "Internal server error"}
}, dependencies=[Depends(deps.get_current_active_superuser)])
def delete_record(table_name: str, record_id: str, db: Session = Depends(deps.get_db)):
    """
    Delete a record from the specified table.
    
    **Warning:** This permanently deletes data from the database.
    """
    try:
        # Get primary key column name
        pk_result = db.execute(text("""
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public'
                AND tc.table_name = :table_name
            LIMIT 1
        """), {'table_name': table_name}).scalar()
        
        if not pk_result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table has no primary key"
            )
        
        pk_column = pk_result
        
        # Delete the record
        result = db.execute(text(f'DELETE FROM "{table_name}" WHERE "{pk_column}" = :record_id'), {'record_id': record_id}) # nosec
        db.commit()

        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Record not found"
            )
        
        return success_response(message=f"Record {record_id} deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Delete record error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete record"
        )


@router.put("/tables/{table_name}/data/{record_id}", responses={
    404: {"description": "Record not found"},
    500: {"description": "Internal server error"}
}, dependencies=[Depends(deps.get_current_active_superuser)])
def update_record(table_name: str, record_id: str, data: Dict[str, Any], db: Session = Depends(deps.get_db)):
    """
    Update a record in the specified table.
    
    **Request Body:** JSON object with column names as keys and new values.
    """
    try:
        # Get primary key column name
        pk_result = db.execute(text("""
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public'
                AND tc.table_name = :table_name
            LIMIT 1
        """), {'table_name': table_name}).scalar()
        
        if not pk_result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table has no primary key"
            )
        
        pk_column = pk_result
        
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
        
        set_clause = ', '.join([f'"{col}" = :{col}' for col in update_data.keys()])
        values = {**update_data, 'record_id': record_id}
        
        result = db.execute(
            text(f'UPDATE "{table_name}" SET {set_clause} WHERE "{pk_column}" = :record_id'), # nosec
            values
        )
        db.commit()
        
        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Record not found"
            )
        
        return success_response(message=f"Record {record_id} updated successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Update record error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update record"
        )