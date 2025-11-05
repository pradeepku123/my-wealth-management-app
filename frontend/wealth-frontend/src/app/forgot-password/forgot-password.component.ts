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

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private http: HttpClient, 
    private snackBar: MatSnackBar
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
    
    this.http.post('http://localhost:8000/auth/reset-password', {
      user_id: this.userId,
      new_password: this.newPassword
    }).subscribe({
      next: (response: any) => {
        this.snackBar.open('Password reset successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.detail || 'Failed to reset password';
      }
    });
  }

  backToLogin(event: Event) {
    event.preventDefault();
    this.router.navigate(['/login']);
  }
}