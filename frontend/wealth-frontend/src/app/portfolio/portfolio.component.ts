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
  private apiUrl = window.location.origin.replace('4200', '8000');

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  ngOnInit() {
    this.loadFunds();
    this.loadUsername();
  }

  loadFunds() {
    this.http.get<any[]>(`${this.apiUrl}/portfolio/funds`).subscribe({
      next: (funds) => {
        this.funds = funds;
        this.calculateTotals();
      },
      error: (error) => console.error('Error loading funds:', error)
    });
  }

  calculateTotals() {
    this.totalInvested = this.funds.reduce((sum, fund) => sum + fund.invested_amount, 0);
    this.totalCurrent = this.funds.reduce((sum, fund) => sum + fund.current_value, 0);
    this.totalReturns = this.totalCurrent - this.totalInvested;
  }

  addFund() {
    const dialogRef = this.dialog.open(AddFundDialogComponent, {
      width: '450px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFunds();
      }
    });
  }

  editFund(fund: any) {
    const dialogRef = this.dialog.open(AddFundDialogComponent, {
      width: '450px',
      data: { fund: fund }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFunds();
      }
    });
  }

  deleteFund(id: number) {
    this.http.delete(`${this.apiUrl}/portfolio/funds/${id}`).subscribe({
      next: () => this.loadFunds(),
      error: (error) => console.error('Error deleting fund:', error)
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