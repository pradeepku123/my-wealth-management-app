import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AddFundDialogComponent } from './add-fund-dialog.component';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';

import { StatCardComponent } from '../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, AddFundDialogComponent, StatCardComponent],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit {
  @ViewChild(AddFundDialogComponent) addFundDialog!: AddFundDialogComponent;

  funds: any[] = [];
  filteredFunds: any[] = [];
  totalInvested = 0;
  totalCurrent = 0;
  totalReturns = 0;
  username = '';
  dialogData: any = {
    id: null,
    investment_type: '',
    fund_name: '',
    invested_amount: 0,
    current_value: 0
  };
  isEditMode = false;
  private apiUrl = '/api/v1';
  currentFilterType: string | null = null;

  investmentTypes = [
    { value: 'mutual_fund', label: 'Mutual Fund' },
    { value: 'stock', label: 'Stocks' },
    { value: 'epf', label: 'EPF' },
    { value: 'ppf', label: 'PPF' },
    { value: 'fd', label: 'Fixed Deposit' },
    { value: 'gold', label: 'Gold' },
    { value: 'nps', label: 'NPS' },
    { value: 'mis', label: 'MIS' }
  ];

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.currentFilterType = params['type'] || null;
      // If we already have funds loaded, just re-apply filter
      if (this.funds.length > 0) {
        this.applyFilter();
      } else {
        this.loadFunds();
      }
    });
    this.loadUsername();
  }

  loadFunds() {
    console.log('Loading funds from:', `${this.apiUrl}/portfolio/funds`);
    this.http.get<APIResponse>(`${this.apiUrl}/portfolio/funds`).subscribe({
      next: (response: APIResponse) => {
        console.log('Funds response:', response);
        if (response.success && response.data) {
          this.funds = response.data.filter((fund: any) => fund.fund_name && fund.fund_name.trim() !== '');
          this.applyFilter();
        }
      },
      error: (error) => {
        console.error('Error loading funds:', this.errorHandler.extractErrorMessage(error));
        console.error('Full error:', error);
      }
    });
  }

  applyFilter() {
    if (this.currentFilterType) {
      this.filteredFunds = this.funds.filter(fund => fund.investment_type === this.currentFilterType);
    } else {
      this.filteredFunds = [...this.funds];
    }
    console.log('Filtered funds:', this.filteredFunds);
    this.calculateTotals();
  }

  setFilter(type: string | null) {
    this.currentFilterType = type;
    this.applyFilter();
  }

  calculateTotals() {
    this.totalInvested = this.filteredFunds.reduce((sum, fund) => sum + parseFloat(fund.invested_amount || 0), 0);
    this.totalCurrent = this.filteredFunds.reduce((sum, fund) => sum + parseFloat(fund.current_value || 0), 0);
    this.totalReturns = this.totalCurrent - this.totalInvested;
    console.log('Calculated totals:', {
      totalInvested: this.totalInvested,
      totalCurrent: this.totalCurrent,
      totalReturns: this.totalReturns,
      fundsCount: this.filteredFunds.length
    });
  }

  addFund() {
    this.isEditMode = false;
    this.dialogData = {
      id: null,
      investment_type: '',
      fund_name: '',
      invested_amount: 0,
      current_value: 0
    };
    this.addFundDialog.modal.show();
  }

  editFund(fund: any) {
    this.isEditMode = true;
    this.dialogData = { ...fund };
    this.addFundDialog.modal.show();
  }

  // Handler for the inline add-fund dialog (bootstrap modal) close event
  handleAddFundDialogClose(result: boolean) {
    if (result) {
      this.loadFunds();
    }
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
        const rawUsername = payload.full_name || payload.email || 'User';
        this.username = this.capitalizeFirstLetter(rawUsername);
      } catch (error) {
        this.username = 'User';
      }
    } else {
      this.username = 'User';
    }
  }

  capitalizeFirstLetter(str: string): string {
    if (!str) return '';
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}