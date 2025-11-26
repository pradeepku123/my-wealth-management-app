import { Component, OnInit, OnDestroy } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { APIResponse } from '../services/api-response.interface';
import { EventBusService } from '../services/event-bus.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-mutual-funds',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mutual-funds.component.html',
  styleUrl: './mutual-funds.component.scss'
})
export class MutualFundsComponent implements OnInit, OnDestroy {
  mutualFunds: any[] = [];
  groupedFunds: any = {};
  // Table mode state & data
  showTable = false;
  tableData: any[] = [];
  loading = false;
  private apiUrl = '/api/v1';

  private subscriptions: Subscription = new Subscription();

  constructor(private http: HttpClient, private eventBus: EventBusService) { }

  ngOnInit() {
    this.loadMutualFunds();

    // Refresh mutual funds view/table when a mutual fund is added/edited elsewhere
    const sub = this.eventBus.mutualFundUpdated$.subscribe(() => {
      // Always refresh market data and table (table will reload only if visible)
      this.loadMutualFunds();
      if (this.showTable) {
        this.loadTableData();
      }
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  toggleTableView() {
    this.showTable = !this.showTable;
    if (this.showTable) {
      this.loadTableData();
    }
  }

  loadTableData(limit: number = 100) {
    this.loading = true;
    this.http.get<APIResponse>(`${this.apiUrl}/admin/tables/mutual_funds/data?limit=${limit}`).subscribe({
      next: (response) => {
        this.tableData = response.data?.data || response.data || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading mutual funds table data:', error);
        this.loading = false;
      }
    });
  }

  loadMutualFunds() {
    this.loading = true;
    // Use the market endpoint which returns popular mutual fund NAV data (falls back to mock data)
    this.http.get<APIResponse>(`${this.apiUrl}/market/mutual-funds`).subscribe({
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