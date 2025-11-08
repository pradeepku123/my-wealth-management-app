import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  userId = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  hidePassword = true;
  private apiUrl = window.location.origin.replace('4200', '8000');

  constructor(
    private router: Router, 
    private http: HttpClient, 
    private snackBar: MatSnackBar,
    private errorHandler: ErrorHandlerService
  ) {}



  onLogin() {
    this.errorMessage = '';
    
    if (!this.userId.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter both User ID and Password';
      return;
    }
    
    this.isLoading = true;
    
    this.http.post<APIResponse>(`${this.apiUrl}/auth/login`, {
      user_id: this.userId,
      password: this.password
    }).subscribe({
      next: (response: APIResponse) => {
        this.isLoading = false;
        if (response.success && response.data) {
          localStorage.setItem('token', response.data.access_token);
          this.snackBar.open(response.message || 'Login successful!', 'Close', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = response.message || 'Login failed';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.errorHandler.extractErrorMessage(error);
      }
    });
  }

  onForgotPassword(event: Event) {
    event.preventDefault();
    if (!this.userId) {
      this.errorMessage = 'Please enter your User ID first';
      return;
    }
    
    this.http.post<APIResponse>(`${this.apiUrl}/auth/forgot-password`, {
      user_id: this.userId
    }).subscribe({
      next: (response: APIResponse) => {
        if (response.success) {
          this.router.navigate(['/forgot-password'], { queryParams: { userId: this.userId } });
        } else {
          this.errorMessage = response.message || 'Request failed';
        }
      },
      error: (error) => {
        this.errorMessage = this.errorHandler.extractErrorMessage(error);
      }
    });
  }
}