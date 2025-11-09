import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { APIResponse } from '../services/api-response.interface';

@Component({
  selector: 'app-mutual-funds',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './mutual-funds.component.html',
  styleUrl: './mutual-funds.component.scss'
})
export class MutualFundsComponent implements OnInit {
  mutualFunds: any[] = [];
  groupedFunds: any = {};
  loading = false;
  private apiUrl = window.location.origin.replace('4200', '8000');

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadMutualFunds();
  }

  loadMutualFunds() {
    this.loading = true;
    this.http.get<APIResponse>(`${this.apiUrl}/portfolio/mutual-funds-nav`).subscribe({
      next: (response) => {
        this.mutualFunds = response.data || [];
        this.groupFundsByCategory();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading mutual funds:', error);
        this.loading = false;
      }
    });
  }

  groupFundsByCategory() {
    this.groupedFunds = {};
    this.mutualFunds.forEach(fund => {
      const category = fund.category || 'Other';
      const subCategory = fund.sub_category || 'Other';
      
      if (!this.groupedFunds[category]) {
        this.groupedFunds[category] = {};
      }
      
      if (!this.groupedFunds[category][subCategory]) {
        this.groupedFunds[category][subCategory] = [];
      }
      
      this.groupedFunds[category][subCategory].push(fund);
    });
  }

  getCategories() {
    return Object.keys(this.groupedFunds);
  }

  getSubCategories(category: string) {
    return Object.keys(this.groupedFunds[category] || {});
  }

  getFundsInSubCategory(category: string, subCategory: string) {
    return this.groupedFunds[category]?.[subCategory] || [];
  }

  getFundShortName(fullName: string): string {
    const parts = fullName.split(' ');
    if (parts.length > 3) {
      return `${parts[0]} ${parts[1]} Fund`;
    }
    return fullName.length > 30 ? fullName.substring(0, 30) + '...' : fullName;
  }

  refreshData() {
    this.loadMutualFunds();
  }
}