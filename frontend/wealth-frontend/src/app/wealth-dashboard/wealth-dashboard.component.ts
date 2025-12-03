import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-wealth-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wealth-dashboard.component.html',
  styleUrl: './wealth-dashboard.component.scss'
})
export class WealthDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('portfolioChart') portfolioChartRef!: ElementRef;
  chart: any;

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

  ngAfterViewInit() {
    // Chart will be updated when data is loaded
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
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
    this.updateChart();
  }

  navigateToPortfolio(type: string) {
    // Navigate to portfolio with query param to filter by type if needed
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

  updateChart() {
    if (!this.portfolioChartRef || this.assetBreakdown.length === 0) return;

    const ctx = this.portfolioChartRef.nativeElement.getContext('2d');

    const labels = this.assetBreakdown.map(asset => this.getAssetTypeLabel(asset.investment_type));
    const data = this.assetBreakdown.map(asset => parseFloat(asset.total_current));
    const backgroundColors = this.assetBreakdown.map(asset => this.getChartColor(asset.investment_type));

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = data;
      this.chart.data.datasets[0].backgroundColor = backgroundColors;
      this.chart.update();
    } else {
      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              display: false // We have a custom legend in HTML or we can enable it here
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed !== null) {
                    label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(context.parsed);
                  }
                  return label;
                }
              }
            }
          }
        }
      });
    }
  }
}