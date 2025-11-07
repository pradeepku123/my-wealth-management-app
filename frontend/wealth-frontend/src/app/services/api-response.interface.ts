export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: Record<string, any>;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationMeta;
  timestamp: string;
}