import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecommendationsService } from '../../services/recommendations.service';

@Component({
  selector: 'app-compare-funds',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compare-funds.component.html',
  styleUrl: './compare-funds.component.scss'
})
export class CompareFundsComponent implements OnInit {
  @Input() schemeCodes: string[] = [];
  @Output() closeCompare = new EventEmitter<void>();

  fundsData: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private recommendationsService: RecommendationsService) {}

  ngOnInit() {
    if (this.schemeCodes.length > 0) {
      this.loadComparisonData();
    } else {
      this.error = "No funds selected for comparison.";
      this.loading = false;
    }
  }

  loadComparisonData() {
    this.loading = true;
    this.error = null;
    this.recommendationsService.getMultipleFundDetails(this.schemeCodes).subscribe({
      next: (responses: any[]) => {
        // ApiService already unwraps the APIResponse, so responses is an array of fund data
        this.fundsData = responses;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error fetching fund details for comparison', err);
        this.error = "Failed to load fund details. Please try again.";
        this.loading = false;
      }
    });
  }

  get returnsPeriods(): string[] {
    return ['1W', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'Inception'];
  }
}
