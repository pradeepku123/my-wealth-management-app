import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { APIResponse, PaginatedResponse } from './api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = window.location.origin.replace('4200', '8000');

  constructor(private http: HttpClient) {}

  // Generic GET request
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<APIResponse<T>>(`${this.apiUrl}${endpoint}`)
      .pipe(
        map(response => this.handleSuccess(response)),
        catchError(this.handleError)
      );
  }

  // Generic POST request
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<APIResponse<T>>(`${this.apiUrl}${endpoint}`, data)
      .pipe(
        map(response => this.handleSuccess(response)),
        catchError(this.handleError)
      );
  }

  // Paginated GET request
  getPaginated<T>(endpoint: string, page: number = 1, perPage: number = 10): Observable<PaginatedResponse<T>> {
    return this.http.get<PaginatedResponse<T>>(`${this.apiUrl}${endpoint}?page=${page}&per_page=${perPage}`)
      .pipe(catchError(this.handleError));
  }

  private handleSuccess<T>(response: APIResponse<T>): T {
    if (!response.success) {
      throw new Error(response.message || 'API request failed');
    }
    return response.data as T;
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'An error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.detail) {
      errorMessage = error.error.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  };
}