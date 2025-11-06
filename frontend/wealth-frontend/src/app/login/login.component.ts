import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  userId = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  private apiUrl = window.location.origin.replace('4200', '8000');

  constructor(private router: Router, private http: HttpClient, private snackBar: MatSnackBar) {}

  onLogin() {
    this.errorMessage = '';
    this.isLoading = true;
    
    this.http.post(`${this.apiUrl}/auth/login`, {
      user_id: this.userId,
      password: this.password
    }).subscribe({
      next: (response: any) => {
        localStorage.setItem('token', response.access_token);
        this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.detail || 'Login failed. Please try again.';
      }
    });
  }

  onForgotPassword(event: Event) {
    event.preventDefault();
    if (!this.userId) {
      this.errorMessage = 'Please enter your User ID first';
      return;
    }
    
    this.http.post(`${this.apiUrl}/auth/forgot-password`, {
      user_id: this.userId
    }).subscribe({
      next: (response: any) => {
        this.router.navigate(['/forgot-password'], { queryParams: { userId: this.userId } });
      },
      error: (error) => {
        this.errorMessage = error.error?.detail || 'User not found';
      }
    });
  }
}