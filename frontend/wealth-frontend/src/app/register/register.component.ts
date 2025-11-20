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
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  userData = {
    user_id: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    email: ''
  };
  errorMessage = '';
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  private apiUrl = '/api/v1';

  constructor(
    private router: Router,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private errorHandler: ErrorHandlerService
  ) {}

  onRegister() {
    this.errorMessage = '';
    
    if (!this.isValid()) {
      return;
    }
    
    if (this.userData.password !== this.userData.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }
    
    this.isLoading = true;
    
    const { confirmPassword, ...registrationData } = this.userData;
    
    this.http.post<APIResponse>(`${this.apiUrl}/auth/register`, registrationData).subscribe({
      next: (response: APIResponse) => {
        if (response.success) {
          this.snackBar.open(response.message || 'Registration successful!', 'Close', { duration: 3000 });
          this.router.navigate(['/login']);
        } else {
          this.isLoading = false;
          this.errorMessage = response.message || 'Registration failed';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.errorHandler.extractErrorMessage(error);
      }
    });
  }

  isValid(): boolean {
    return this.userData.user_id.trim() !== '' &&
           this.userData.password.length >= 6 &&
           this.userData.full_name.trim() !== '' &&
           this.userData.email.trim() !== '' &&
           this.isValidEmail(this.userData.email);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}