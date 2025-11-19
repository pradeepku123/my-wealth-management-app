import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { APIResponse, PaginatedResponse } from './api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = window.location.origin.replace('4200', '8000') + '/api/v1';

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
    // Let components handle errors directly for better control
    return throwError(() => error);
  };
}