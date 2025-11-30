import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { APIResponse } from '../../services/api-response.interface';

@Component({
    selector: 'app-profile-settings',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile-settings.component.html',
    styles: [`
    .settings-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.04);
      border: 1px solid rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .settings-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      background: #f8f9fa;
    }
    .settings-body {
      padding: 2rem;
    }
    .form-label {
      font-weight: 500;
      color: #495057;
      margin-bottom: 0.5rem;
    }
    .form-control {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }
    .form-control:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
    }
    .btn-primary {
      padding: 0.75rem 1.5rem;
      font-weight: 600;
    }
  `]
})
export class ProfileSettingsComponent implements OnInit {
    profileForm: FormGroup;
    passwordForm: FormGroup;
    isLoading = false;
    successMessage = '';
    errorMessage = '';
    passwordSuccessMessage = '';
    passwordErrorMessage = '';
    private apiUrl = '/api/v1';

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private authService: AuthService
    ) {
        this.profileForm = this.fb.group({
            full_name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]]
        });

        this.passwordForm = this.fb.group({
            current_password: ['', Validators.required],
            new_password: ['', [Validators.required, Validators.minLength(6)]],
            confirm_password: ['', Validators.required]
        }, { validator: this.passwordMatchValidator });
    }

    ngOnInit() {
        this.loadUserProfile();
    }

    passwordMatchValidator(g: FormGroup) {
        return g.get('new_password')?.value === g.get('confirm_password')?.value
            ? null : { mismatch: true };
    }

    loadUserProfile() {
        const userId = this.authService.getUserId();
        if (!userId) return;

        this.http.get<APIResponse>(`${this.apiUrl}/auth/user-info?user_id=${userId}`).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.profileForm.patchValue({
                        full_name: response.data.full_name,
                        email: response.data.email
                    });
                }
            },
            error: (error) => {
                console.error('Error loading profile:', error);
            }
        });
    }

    onUpdateProfile() {
        if (this.profileForm.invalid) return;

        this.isLoading = true;
        this.successMessage = '';
        this.errorMessage = '';

        this.http.put<APIResponse>(`${this.apiUrl}/auth/profile`, this.profileForm.value).subscribe({
            next: (response) => {
                this.isLoading = false;
                if (response.success) {
                    this.successMessage = 'Profile updated successfully';
                    // Update local storage token if needed or just let it be since we use ID mostly
                } else {
                    this.errorMessage = response.message || 'Failed to update profile';
                }
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.error?.detail || 'An error occurred';
            }
        });
    }

    onChangePassword() {
        if (this.passwordForm.invalid) return;

        this.isLoading = true;
        this.passwordSuccessMessage = '';
        this.passwordErrorMessage = '';

        const payload = {
            current_password: this.passwordForm.get('current_password')?.value,
            new_password: this.passwordForm.get('new_password')?.value
        };

        this.http.post<APIResponse>(`${this.apiUrl}/auth/change-password`, payload).subscribe({
            next: (response) => {
                this.isLoading = false;
                if (response.success) {
                    this.passwordSuccessMessage = 'Password changed successfully';
                    this.passwordForm.reset();
                } else {
                    this.passwordErrorMessage = response.message || 'Failed to change password';
                }
            },
            error: (error) => {
                this.isLoading = false;
                this.passwordErrorMessage = error.error?.detail || 'An error occurred';
            }
        });
    }
}
