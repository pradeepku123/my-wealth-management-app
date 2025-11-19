import { Component } from '@angular/core';
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
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  hidePassword = true;
  showError = false;
  usernameTouched = false;
  passwordTouched = false;

  constructor(
    private router: Router, 
    private http: HttpClient, 
    private snackBar: MatSnackBar,
    private errorHandler: ErrorHandlerService
  ) {}

  get isUsernameValid(): boolean {
    return this.username.trim().length >= 3;
  }

  get isPasswordValid(): boolean {
    return this.password.length >= 6;
  }

  get isFormValid(): boolean {
    return this.isUsernameValid && this.isPasswordValid;
  }

  onUsernameBlur() {
    this.usernameTouched = true;
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
      this.showErrorMessage('Please enter valid Username (min 3 chars) and Password (min 6 chars)');
      return;
    }
    
    this.isLoading = true;
    
    const body = new URLSearchParams();
    body.set('username', this.username.trim());
    body.set('password', this.password);
    body.set('grant_type', 'password');
    body.set('scope', '');
    body.set('client_id', 'string');
    body.set('client_secret', '********');

    this.http.post<any>(`/api/v1/auth/login/access-token`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.access_token) {
          localStorage.setItem('token', response.access_token);
          this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        } else {
          this.showErrorMessage('Login failed: Invalid response from server');
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
    
    if (!this.username.trim()) {
      this.showErrorMessage('Please enter your Username first to reset password');
      return;
    }
    
    this.http.post<APIResponse>(`/api/v1/auth/forgot-password`, {
      user_id: this.username.trim()
    }).subscribe({
      next: (response: APIResponse) => {
        if (response.success) {
          this.router.navigate(['/forgot-password'], { queryParams: { username: this.username.trim() } });
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