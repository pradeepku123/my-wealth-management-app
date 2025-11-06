import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mutual-funds',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './mutual-funds.component.html',
  styleUrl: './mutual-funds.component.scss'
})
export class MutualFundsComponent implements OnInit {
  mutualFunds: any[] = [];
  filteredFunds: any[] = [];
  loading = false;
  showFiltered = false;
  private apiUrl = window.location.origin.replace('4200', '8000');

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadMutualFunds();
    this.loadFilteredFunds();
  }

  loadMutualFunds() {
    this.loading = true;
    this.http.get<any[]>(`${this.apiUrl}/market/mutual-funds`).subscribe({
      next: (data) => {
        this.mutualFunds = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading mutual funds:', error);
        this.loading = false;
      }
    });
  }

  loadFilteredFunds() {
    this.loading = true;
    this.http.get<any[]>(`${this.apiUrl}/market/mutual-funds/filter?codes=145137,147946`).subscribe({
      next: (data) => {
        this.filteredFunds = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading filtered funds:', error);
        this.loading = false;
      }
    });
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
    this.loadFilteredFunds();
  }

  toggleView() {
    this.showFiltered = !this.showFiltered;
  }

  getCurrentFunds() {
    return this.showFiltered ? this.filteredFunds : this.mutualFunds;
  }
}