import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  analyticsData: any = null;
  loading = false;
  private apiUrl = '/api/v1';

  constructor(private http: HttpClient, private errorHandler: ErrorHandlerService) { }

  ngOnInit() {
    this.loadAnalyticsData();
  }

  loadAnalyticsData() {
    this.loading = true;
    this.http.get<APIResponse>(`${this.apiUrl}/analytics/dashboard`).subscribe({
      next: (response: APIResponse) => {
        if (response.success && response.data) {
          this.analyticsData = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', this.errorHandler.extractErrorMessage(error));
        this.loading = false;
      }
    });
  }

  getAssetColor(type: string): string {
    const colors: { [key: string]: string } = {
      'mutual_fund': '#4f46e5', // Indigo
      'stock': '#8b5cf6', // Violet
      'epf': '#10b981', // Emerald
      'ppf': '#f59e0b', // Amber
      'fd': '#3b82f6', // Blue
      'gold': '#f97316', // Orange
      'nps': '#06b6d4', // Cyan
      'mis': '#ec4899' // Pink
    };
    return colors[type] || '#6b7280';
  }

  getAssetTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'mutual_fund': 'Mutual Funds',
      'epf': 'EPF',
      'ppf': 'PPF',
      'fd': 'Fixed Deposits',
      'mis': 'MIS',
      'nps': 'NPS',
      'stock': 'Stocks',
      'gold': 'Gold'
    };
    return typeMap[type] || type;
  }

  refreshData() {
    this.loadAnalyticsData();
  }
}