import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecommendationsService } from '../services/recommendations.service';
import { MutualFund } from '../models/mutual-fund.model';

@Component({
    selector: 'app-recommendations',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './recommendations.component.html',
    styleUrls: ['./recommendations.component.scss']
})
export class RecommendationsComponent implements OnInit {
    recommendedFunds: MutualFund[] = [];
    isLoading = true;
    error: string | null = null;

    constructor(private recommendationsService: RecommendationsService) { }

    ngOnInit(): void {
        this.fetchRecommendations();
    }

    fetchRecommendations(): void {
        this.isLoading = true;
        this.recommendationsService.getRecommendedMutualFunds().subscribe({
            next: (data) => {
                this.recommendedFunds = data;
                this.isLoading = false;
            },
            error: (err) => {
                this.error = 'Failed to load recommendations';
                this.isLoading = false;
                console.error(err);
            }
        });
    }
}
