import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AddFundDialogComponent } from './add-fund-dialog.component';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatFormFieldModule, MatInputModule, MatDialogModule, CommonModule],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit {
  funds: any[] = [];
  displayedColumns: string[] = ['type', 'name', 'invested', 'current', 'returns', 'percentage', 'actions'];
  totalInvested = 0;
  totalCurrent = 0;
  totalReturns = 0;
  username = '';
  private apiUrl = '/api/v1';

  constructor(private http: HttpClient, private dialog: MatDialog, private errorHandler: ErrorHandlerService) {}

  ngOnInit() {
    this.loadFunds();
    this.loadUsername();
  }

  loadFunds() {
    console.log('Loading funds from:', `${this.apiUrl}/portfolio/funds`);
    this.http.get<APIResponse>(`${this.apiUrl}/portfolio/funds`).subscribe({
      next: (response: APIResponse) => {
        console.log('Funds response:', response);
        if (response.success && response.data) {
          this.funds = response.data.filter((fund: any) => fund.fund_name && fund.fund_name.trim() !== '');
          console.log('Filtered funds:', this.funds);
          this.calculateTotals();
        }
      },
      error: (error) => {
        console.error('Error loading funds:', this.errorHandler.extractErrorMessage(error));
        console.error('Full error:', error);
      }
    });
  }

  calculateTotals() {
    this.totalInvested = this.funds.reduce((sum, fund) => sum + parseFloat(fund.invested_amount || 0), 0);
    this.totalCurrent = this.funds.reduce((sum, fund) => sum + parseFloat(fund.current_value || 0), 0);
    this.totalReturns = this.totalCurrent - this.totalInvested;
    console.log('Calculated totals:', {
      totalInvested: this.totalInvested,
      totalCurrent: this.totalCurrent,
      totalReturns: this.totalReturns,
      fundsCount: this.funds.length
    });
  }

  addFund() {
    const dialogRef = this.dialog.open(AddFundDialogComponent, {
      width: '500px',
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFunds();
      }
    });
  }

  editFund(fund: any) {
    const dialogRef = this.dialog.open(AddFundDialogComponent, {
      width: '500px',
      disableClose: false,
      autoFocus: true,
      data: { fund: fund }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFunds();
      }
    });
  }

  deleteFund(id: number) {
    this.http.delete<APIResponse>(`${this.apiUrl}/portfolio/funds/${id}`).subscribe({
      next: (response: APIResponse) => {
        if (response.success) {
          this.loadFunds();
        }
      },
      error: (error) => console.error('Error deleting fund:', this.errorHandler.extractErrorMessage(error))
    });
  }

  getInvestmentTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'mutual_fund': 'Mutual Fund',
      'epf': 'EPF',
      'ppf': 'PPF',
      'fd': 'FD',
      'mis': 'MIS',
      'nps': 'NPS'
    };
    return typeMap[type] || type;
  }

  loadUsername() {
    // Get username from localStorage or decode from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const rawUsername = payload.sub || 'User';
        this.username = this.capitalizeFirstLetter(rawUsername);
      } catch (error) {
        this.username = 'User';
      }
    } else {
      this.username = 'User';
    }
  }

  capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}