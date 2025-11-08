import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  extractErrorMessage(error: any): string {
    // Handle standardized API error response
    if (error.error?.message) {
      return error.error.message;
    }
    
    // Handle error array from standardized response
    if (error.error?.errors && error.error.errors.length > 0) {
      return error.error.errors[0];
    }
    
    // Fallback to detail or generic message
    return error.error?.detail || error.message || 'An error occurred';
  }

  getNetworkErrorMessage(status: number): string {
    switch (status) {
      case 0: return 'Network connection failed';
      case 401: return 'Authentication failed';
      case 403: return 'Access forbidden';
      case 404: return 'Resource not found';
      case 500: return 'Server error occurred';
      case 503: return 'Service unavailable';
      default: return 'An error occurred';
    }
  }
}