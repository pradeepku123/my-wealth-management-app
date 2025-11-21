from typing import Any, List, TypeVar
from app.schemas.response import APIResponse, PaginatedResponse, PaginationMeta

T = TypeVar('T')

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
