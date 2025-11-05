import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-wealth-dashboard',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dashboard-container">
      <h1>Wealth Management Dashboard</h1>
      
      <div class="cards-grid">
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Total Portfolio Value</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2>$125,430.50</h2>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Monthly Growth</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2>+5.2%</h2>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Active Investments</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2>12</h2>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .dashboard-card {
      text-align: center;
    }
  `]
})
export class WealthDashboardComponent { }