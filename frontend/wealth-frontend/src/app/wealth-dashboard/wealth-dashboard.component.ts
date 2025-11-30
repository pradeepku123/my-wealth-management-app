import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  totalInvested = 0;
  totalCurrentValue = 0;
  totalReturns = 0;
  totalReturnsPercentage = 0;

  private apiUrl = '/api/v1';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private router: Router
  ) { }

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
          this.calculateTotals();
        }
      },
      error: (error) => {
        console.error('Error loading asset breakdown:', this.errorHandler.extractErrorMessage(error));
      }
    });
  }

  calculateTotals() {
    this.totalInvested = this.assetBreakdown.reduce((sum, asset) => sum + parseFloat(asset.total_invested || 0), 0);
    this.totalCurrentValue = this.assetBreakdown.reduce((sum, asset) => sum + parseFloat(asset.total_current || 0), 0);
    this.totalReturns = this.totalCurrentValue - this.totalInvested;
    this.totalReturnsPercentage = this.totalInvested > 0 ? (this.totalReturns / this.totalInvested) * 100 : 0;
  }

  navigateToPortfolio(type: string) {
    // Navigate to portfolio with query param to filter by type if needed
    // Assuming portfolio component can handle 'type' query param or just navigating to main portfolio
    this.router.navigate(['/portfolio'], { queryParams: { type: type } });
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
      'gold': 'Gold',
      'foreign_stock': 'Foreign Stock',
    };
    return typeMap[type] || type;
  }

  // Chart Logic
  getPieChartPath(index: number): string {
    if (this.totalCurrentValue === 0) return '';

    let startAngle = 0;
    for (let i = 0; i < index; i++) {
      startAngle += (parseFloat(this.assetBreakdown[i].total_current) / this.totalCurrentValue) * 360;
    }

    const sliceAngle = (parseFloat(this.assetBreakdown[index].total_current) / this.totalCurrentValue) * 360;
    const endAngle = startAngle + sliceAngle;

    // Convert angles to radians
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;

    // Center and radius
    const x = 100;
    const y = 100;
    const r = 80;

    // Points
    const x1 = x + r * Math.cos(startRad);
    const y1 = y + r * Math.sin(startRad);
    const x2 = x + r * Math.cos(endRad);
    const y2 = y + r * Math.sin(endRad);

    // SVG Path
    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    return `M ${x} ${y} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  }

  getChartColor(type: string): string {
    const colors: { [key: string]: string } = {
      'mutual_fund': '#0d6efd', // Primary
      'stock': '#6610f2', // Indigo
      'ppf': '#198754', // Success
      'epf': '#20c997', // Teal
      'fd': '#ffc107', // Warning
      'gold': '#fd7e14', // Orange
      'nps': '#0dcaf0', // Info
      'mis': '#6c757d' // Secondary
    };
    return colors[type] || '#adb5bd';
  }
}