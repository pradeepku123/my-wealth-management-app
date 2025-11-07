from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with standardized error format"""
    
    error_messages = [exc.detail] if exc.detail else ["An error occurred"]
    
    error_response = {
        "success": False,
        "message": get_error_message(exc.status_code),
        "data": None,
        "errors": error_messages,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions with standardized error format"""
    logger.error(f"Unhandled exception: {str(exc)}")
    
    error_response = {
        "success": False,
        "message": "Internal server error",
        "data": None,
        "errors": ["An unexpected error occurred"],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    return JSONResponse(
        status_code=500,
        content=error_response
    )

def get_error_message(status_code: int) -> str:
    """Get appropriate error message for status code"""
    messages = {
        400: "Bad request",
        401: "Authentication failed", 
        403: "Access forbidden",
        404: "Resource not found",
        422: "Validation error",
        500: "Internal server error",
        503: "Service unavailable"
    }
    return messages.get(status_code, "An error occurred")