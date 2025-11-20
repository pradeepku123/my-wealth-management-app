import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, FormsModule, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  userId = '';
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';
  isLoading = false;
  private apiUrl = '/api/v1';

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private http: HttpClient, 
    private snackBar: MatSnackBar,
    private errorHandler: ErrorHandlerService
  ) {
    this.userId = this.route.snapshot.queryParams['userId'] || '';
  }

  onResetPassword() {
    this.errorMessage = '';
    
    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }
    
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }
    
    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }
    
    this.isLoading = true;
    
    this.http.post<APIResponse>(`${this.apiUrl}/auth/reset-password`, {
      user_id: this.userId,
      new_password: this.newPassword
    }).subscribe({
      next: (response: APIResponse) => {
        if (response.success) {
          this.snackBar.open(response.message || 'Password reset successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/login']);
        } else {
          this.isLoading = false;
          this.errorMessage = response.message || 'Failed to reset password';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.errorHandler.extractErrorMessage(error);
      }
    });
  }

  backToLogin(event: Event) {
    event.preventDefault();
    this.router.navigate(['/login']);
  }
}