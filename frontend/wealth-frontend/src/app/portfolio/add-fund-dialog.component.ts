import { Component, Inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-fund-dialog',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, FormsModule, CommonModule],
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

  investmentTypes = [
    { value: 'mutual_fund', label: 'Mutual Fund' },
    { value: 'epf', label: 'EPF (Employee Provident Fund)' },
    { value: 'ppf', label: 'PPF (Public Provident Fund)' },
    { value: 'fd', label: 'FD (Fixed Deposit)' },
    { value: 'mis', label: 'MIS (Monthly Income Scheme)' },
    { value: 'nps', label: 'NPS (National Pension System)' }
  ];

  constructor(
    private dialogRef: MatDialogRef<AddFundDialogComponent>,
    private http: HttpClient,
    private snackBar: MatSnackBar,
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

  onSave() {
    const request = this.isEditMode 
      ? this.http.put(`http://localhost:8000/portfolio/funds/${this.fundData.id}`, this.fundData)
      : this.http.post('http://localhost:8000/portfolio/funds', this.fundData);
    
    request.subscribe({
      next: () => {
        const message = this.isEditMode ? 'Investment updated successfully!' : 'Investment added successfully!';
        this.snackBar.open(message, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        const message = this.isEditMode ? 'Error updating investment' : 'Error adding investment';
        this.snackBar.open(message, 'Close', { duration: 3000 });
        console.error('Error:', error);
      }
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}