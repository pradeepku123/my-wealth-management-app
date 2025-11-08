import { Component, Inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';

@Component({
  selector: 'app-add-fund-dialog',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatIconModule, FormsModule, CommonModule],
  templateUrl: './add-fund-dialog.component.html',
  styleUrl: './add-fund-dialog.component.scss'
})
export class AddFundDialogComponent {
  fundData = {
    id: null,
    investment_type: '',
    fund_name: '',
    invested_amount: 0,
    current_value: 0
  };
  
  isEditMode = false;
  dialogTitle = 'Add Investment';
  private apiUrl = window.location.origin.replace('4200', '8000');

  investmentTypes = [
    { value: 'mutual_fund', label: 'Mutual Fund', icon: 'trending_up' },
    { value: 'epf', label: 'EPF (Employee Provident Fund)', icon: 'work' },
    { value: 'ppf', label: 'PPF (Public Provident Fund)', icon: 'savings' },
    { value: 'fd', label: 'FD (Fixed Deposit)', icon: 'account_balance' },
    { value: 'mis', label: 'MIS (Monthly Income Scheme)', icon: 'paid' },
    { value: 'nps', label: 'NPS (National Pension System)', icon: 'elderly' }
  ];

  constructor(
    private dialogRef: MatDialogRef<AddFundDialogComponent>,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private errorHandler: ErrorHandlerService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data && data.fund) {
      this.isEditMode = true;
      this.dialogTitle = 'Edit Investment';
      this.fundData = { ...data.fund };
    }
  }

  isValid(): boolean {
    return this.fundData.investment_type.trim() !== '' &&
           this.fundData.fund_name.trim() !== '' && 
           this.fundData.invested_amount > 0 && 
           this.fundData.current_value > 0;
  }

  getReturns(): number {
    return this.fundData.current_value - this.fundData.invested_amount;
  }

  getReturnsPercentage(): number {
    if (this.fundData.invested_amount === 0) return 0;
    return (this.getReturns() / this.fundData.invested_amount) * 100;
  }

  onSave() {
    const request = this.isEditMode 
      ? this.http.put<APIResponse>(`${this.apiUrl}/portfolio/funds/${this.fundData.id}`, this.fundData)
      : this.http.post<APIResponse>(`${this.apiUrl}/portfolio/funds`, this.fundData);
    
    request.subscribe({
      next: (response: APIResponse) => {
        if (response.success) {
          this.snackBar.open(response.message, 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(response.message || 'Operation failed', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        this.snackBar.open(this.errorHandler.extractErrorMessage(error), 'Close', { duration: 3000 });
      }
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}