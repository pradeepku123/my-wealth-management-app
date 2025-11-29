import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { APIResponse } from '../services/api-response.interface';
import { EventBusService } from '../services/event-bus.service';
import { RecommendationsService } from '../services/recommendations.service';
import { Subscription } from 'rxjs';
import { FundDetailsComponent } from '../recommendations/fund-details/fund-details.component';

@Component({
  selector: 'app-mutual-funds',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FundDetailsComponent],
  templateUrl: './mutual-funds.component.html',
  styleUrl: './mutual-funds.component.scss'
})
export class MutualFundsComponent implements OnInit, OnDestroy {
  mutualFunds: any[] = [];
  groupedFunds: any = {};
  loading = false;
  private apiUrl = '/api/v1';

  // Search properties
  searchQuery = '';
  searchResults: any[] = [];
  isSearching = false;
  searchError: string | null = null;

  // Pagination
  limit = 20;
  offset = 0;
  hasMoreResults = false;
  isLoadingMore = false;

  // Selection properties
  selectedFundCode: string | null = null;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private http: HttpClient,
    private eventBus: EventBusService,
    private recommendationsService: RecommendationsService
  ) { }

  ngOnInit() {
    this.loadMutualFunds();

    // Refresh mutual funds view when a mutual fund is added/edited elsewhere
    const sub = this.eventBus.mutualFundUpdated$.subscribe(() => {
      // Always refresh market data
      this.loadMutualFunds();
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
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

  onSearch(): void {
    if (!this.searchQuery || this.searchQuery.length < 3) {
      this.searchError = 'Please enter at least 3 characters';
      return;
    }

    this.isSearching = true;
    this.searchError = null;
    this.searchResults = [];
    this.selectedFundCode = null; // Clear selection on new search
    this.offset = 0;
    this.hasMoreResults = false;

    this.performSearch();
  }

  performSearch(): void {
    this.recommendationsService.searchFunds(this.searchQuery, this.limit, this.offset).subscribe({
      next: (response) => {
        const data = response.results || [];
        this.hasMoreResults = response.has_more || false;

        if (this.offset === 0) {
          this.searchResults = data;
        } else {
          this.searchResults = [...this.searchResults, ...data];
        }

        this.isSearching = false;
        this.isLoadingMore = false;

        if (this.searchResults.length === 0) {
          this.searchError = 'No funds found matching your query';
        }
      },
      error: (err) => {
        this.searchError = 'Search failed. Please try again.';
        this.isSearching = false;
        this.isLoadingMore = false;
        console.error(err);
      }
    });
  }

  loadMoreResults(): void {
    if (!this.hasMoreResults || this.isLoadingMore) return;

    this.isLoadingMore = true;
    this.offset += this.limit;
    this.performSearch();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.searchError = null;
    this.selectedFundCode = null;
    this.offset = 0;
    this.hasMoreResults = false;
  }

  onSelectFund(code: string): void {
    this.selectedFundCode = code;
  }

  clearSelection(): void {
    this.selectedFundCode = null;
  }

  isInitialState(): boolean {
    return !this.searchQuery && this.searchResults.length === 0 && !this.selectedFundCode;
  }
}