import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wealth-dashboard',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './wealth-dashboard.component.html',
  styleUrl: './wealth-dashboard.component.scss'
})
export class WealthDashboardComponent implements OnInit {
  assetBreakdown: any[] = [];
  private apiUrl = window.location.origin.replace('4200', '8000');

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadAssetBreakdown();
  }

  loadAssetBreakdown() {
    this.http.get(`${this.apiUrl}/portfolio/asset-breakdown`).subscribe({
      next: (data: any) => {
        this.assetBreakdown = data;
      },
      error: (error) => console.error('Error loading asset breakdown:', error)
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