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
  showError = false;
  userIdTouched = false;
  passwordTouched = false;
  private apiUrl = window.location.origin.replace('4200', '8000');

  constructor(
    private router: Router, 
    private http: HttpClient, 
    private snackBar: MatSnackBar,
    private errorHandler: ErrorHandlerService
  ) {}

  get isUserIdValid(): boolean {
    return this.userId.trim().length >= 3;
  }

  get isPasswordValid(): boolean {
    return this.password.length >= 6;
  }

  get isFormValid(): boolean {
    return this.isUserIdValid && this.isPasswordValid;
  }

  onUserIdBlur() {
    this.userIdTouched = true;
  }

  onPasswordBlur() {
    this.passwordTouched = true;
  }

  showErrorMessage(message: string) {
    this.errorMessage = message;
    this.showError = true;
    setTimeout(() => {
      this.showError = false;
    }, 5000);
  }

  clearError() {
    this.showError = false;
    this.errorMessage = '';
  }



  onLogin() {
    this.clearError();
    
    if (!this.isFormValid) {
      this.showErrorMessage('Please enter valid User ID (min 3 chars) and Password (min 6 chars)');
      return;
    }
    
    this.isLoading = true;
    
    this.http.post<APIResponse>(`${this.apiUrl}/auth/login`, {
      user_id: this.userId.trim(),
      password: this.password
    }).subscribe({
      next: (response: APIResponse) => {
        this.isLoading = false;
        if (response.success && response.data) {
          localStorage.setItem('token', response.data.access_token);
          this.snackBar.open(response.message || 'Login successful!', 'Close', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        } else {
          this.showErrorMessage(response.message || 'Login failed');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.showErrorMessage(this.errorHandler.extractErrorMessage(error));
      }
    });
  }

  onForgotPassword(event: Event) {
    event.preventDefault();
    this.clearError();
    
    if (!this.userId.trim()) {
      this.showErrorMessage('Please enter your User ID first to reset password');
      return;
    }
    
    this.http.post<APIResponse>(`${this.apiUrl}/auth/forgot-password`, {
      user_id: this.userId.trim()
    }).subscribe({
      next: (response: APIResponse) => {
        if (response.success) {
          this.router.navigate(['/forgot-password'], { queryParams: { userId: this.userId.trim() } });
        } else {
          this.showErrorMessage(response.message || 'Request failed');
        }
      },
      error: (error) => {
        this.showErrorMessage(this.errorHandler.extractErrorMessage(error));
      }
    });
  }
}