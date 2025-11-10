import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  portfolioData: any[] = [];
  assetBreakdown: any[] = [];
  totalInvested = 0;
  totalCurrent = 0;
  totalReturns = 0;
  totalReturnsPercentage = 0;
  bestPerformer = { name: '', returns: 0 };
  worstPerformer = { name: '', returns: 0 };
  riskLevel = 'Low';
  diversificationScore = 0;
  loading = false;
  private apiUrl = window.location.origin.replace('4200', '8000');

  constructor(private http: HttpClient, private errorHandler: ErrorHandlerService) {}
  
  ngOnInit() {
    this.loadAnalyticsData();
  }

  getAssetColor(type: string): string {
    const colors: { [key: string]: string } = {
      'mutual_fund': '#3B82F6',
      'epf': '#10B981',
      'ppf': '#F59E0B',
      'fd': '#8B5CF6',
      'mis': '#EF4444',
      'nps': '#06B6D4'
    };
    return colors[type] || '#6B7280';
  }

  getAssetPercentage(value: number): number {
    return this.totalCurrent > 0 ? (value / this.totalCurrent) * 100 : 0;
  }

  loadAnalyticsData() {
    this.loading = true;
    Promise.all([
      this.loadPortfolioData(),
      this.loadAssetBreakdown()
    ]).finally(() => {
      this.loading = false;
      this.calculateAnalytics();
    });
  }

  loadPortfolioData() {
    return this.http.get<APIResponse>(`${this.apiUrl}/portfolio/funds`).toPromise().then(
      (response: APIResponse | undefined) => {
        if (response?.success && response.data) {
          this.portfolioData = response.data.filter((fund: any) => fund.fund_name && fund.fund_name.trim() !== '');
        }
      }
    ).catch(error => {
      console.error('Error loading portfolio:', this.errorHandler.extractErrorMessage(error));
    });
  }

  loadAssetBreakdown() {
    return this.http.get<APIResponse>(`${this.apiUrl}/portfolio/asset-breakdown`).toPromise().then(
      (response: APIResponse | undefined) => {
        if (response?.success && response.data) {
          this.assetBreakdown = response.data.filter((asset: any) => asset.investment_type !== '');
        }
      }
    ).catch(error => {
      console.error('Error loading asset breakdown:', this.errorHandler.extractErrorMessage(error));
    });
  }

  calculateAnalytics() {
    // Calculate totals
    this.totalInvested = this.portfolioData.reduce((sum, fund) => sum + parseFloat(fund.invested_amount || 0), 0);
    this.totalCurrent = this.portfolioData.reduce((sum, fund) => sum + parseFloat(fund.current_value || 0), 0);
    this.totalReturns = this.totalCurrent - this.totalInvested;
    this.totalReturnsPercentage = this.totalInvested > 0 ? (this.totalReturns / this.totalInvested) * 100 : 0;

    // Find best and worst performers
    if (this.portfolioData.length > 0) {
      const performers = this.portfolioData.map(fund => ({
        name: fund.fund_name,
        returns: ((fund.current_value - fund.invested_amount) / fund.invested_amount) * 100
      }));
      
      this.bestPerformer = performers.reduce((best, current) => 
        current.returns > best.returns ? current : best
      );
      
      this.worstPerformer = performers.reduce((worst, current) => 
        current.returns < worst.returns ? current : worst
      );
    }

    // Calculate risk level based on returns volatility
    this.riskLevel = this.calculateRiskLevel();
    
    // Calculate diversification score
    this.diversificationScore = this.calculateDiversification();
  }

  calculateRiskLevel(): string {
    if (this.totalReturnsPercentage > 15) return 'High';
    if (this.totalReturnsPercentage > 8) return 'Moderate';
    return 'Low';
  }

  calculateDiversification(): number {
    const uniqueTypes = new Set(this.portfolioData.map(fund => fund.investment_type));
    return Math.min(100, (uniqueTypes.size / 6) * 100); // 6 is max investment types
  }

  getAssetTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'mutual_fund': 'Mutual Funds',
      'epf': 'EPF',
      'ppf': 'PPF', 
      'fd': 'Fixed Deposits',
      'mis': 'MIS',
      'nps': 'NPS'
    };
    return typeMap[type] || type;
  }

  refreshData() {
    this.loadAnalyticsData();
  }
}