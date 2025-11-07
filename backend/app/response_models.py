from typing import Any, Dict, List, Optional, Generic, TypeVar
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar('T')

class APIResponse(BaseModel, Generic[T]):
    """Standard API response wrapper"""
    success: bool = Field(description="Request success status")
    message: str = Field(description="Human readable message")
    data: Optional[T] = Field(default=None, description="Response data")
    errors: Optional[List[str]] = Field(default=None, description="Error messages")
    meta: Optional[Dict[str, Any]] = Field(default=None, description="Metadata")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PaginationMeta(BaseModel):
    """Pagination metadata"""
    page: int = Field(ge=1, description="Current page number")
    per_page: int = Field(ge=1, le=100, description="Items per page")
    total: int = Field(ge=0, description="Total items")
    pages: int = Field(ge=0, description="Total pages")
    has_next: bool = Field(description="Has next page")
    has_prev: bool = Field(description="Has previous page")

class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper"""
    success: bool = True
    message: str = "Data retrieved successfully"
    data: List[T] = Field(description="List of items")
    pagination: PaginationMeta = Field(description="Pagination info")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Response helpers
def success_response(data: Any = None, message: str = "Success") -> APIResponse:
    return APIResponse(success=True, message=message, data=data)

def error_response(message: str, errors: List[str] = None) -> APIResponse:
    return APIResponse(success=False, message=message, errors=errors or [])

def paginated_response(items: List[T], page: int, per_page: int, total: int) -> PaginatedResponse[T]:
    pages = (total + per_page - 1) // per_page
    return PaginatedResponse(
        data=items,
        pagination=PaginationMeta(
            page=page,
            per_page=per_page,
            total=total,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1
        )
    )