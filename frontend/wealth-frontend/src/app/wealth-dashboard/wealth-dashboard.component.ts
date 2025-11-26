import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';

@Component({
  selector: 'app-wealth-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wealth-dashboard.component.html',
  styleUrl: './wealth-dashboard.component.scss'
})
export class WealthDashboardComponent implements OnInit {
  assetBreakdown: any[] = [];
  private apiUrl = '/api/v1';

  constructor(private http: HttpClient, private errorHandler: ErrorHandlerService) { }

  ngOnInit() {
    this.loadAssetBreakdown();
  }

  loadAssetBreakdown() {
    console.log('Loading asset breakdown from:', `${this.apiUrl}/portfolio/asset-breakdown`);
    this.http.get<APIResponse>(`${this.apiUrl}/portfolio/asset-breakdown`).subscribe({
      next: (response: APIResponse) => {
        console.log('Asset breakdown response:', response);
        if (response.success && response.data) {
          this.assetBreakdown = response.data.filter((asset: any) => asset.investment_type !== '');
          console.log('Filtered asset breakdown:', this.assetBreakdown);
        }
      },
      error: (error) => {
        console.error('Error loading asset breakdown:', this.errorHandler.extractErrorMessage(error));
        console.error('Full error:', error);
      }
    });
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
}