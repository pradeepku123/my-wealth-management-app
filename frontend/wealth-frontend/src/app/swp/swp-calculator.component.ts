import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';
import { SnackbarService } from '../services/snackbar.service';

@Component({
    selector: 'app-swp-calculator',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './swp-calculator.component.html',
    styleUrls: ['./swp-calculator.component.scss']
})
export class SwpCalculatorComponent implements OnInit {
    swpName: string = '';
    totalInvestment: number = 1000000;
    withdrawalPerMonth: number = 5000;
    expectedReturn: number = 8;
    timePeriod: number = 10;

    totalWithdrawn: number = 0;
    finalValue: number = 0;
    yearlyData: any[] = [];

    savedSwps: any[] = [];
    private apiUrl = '/api/v1/swp';

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient,
        private errorHandler: ErrorHandlerService,
        private snackbarService: SnackbarService
    ) { }

    ngOnInit() {
        this.loadSavedSwps();
        this.route.queryParams.subscribe(params => {
            if (params['investment']) {
                this.totalInvestment = +params['investment'];
                // Suggest a withdrawal rate? e.g. 0.5% per month
                this.withdrawalPerMonth = Math.round(this.totalInvestment * 0.005);
                this.calculate();
            }
        });
        this.calculate();
    }

    loadSavedSwps() {
        this.http.get<APIResponse>(`${this.apiUrl}/list`).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.savedSwps = response.data;
                }
            },
            error: (error) => {
                console.error('Error loading SWP estimations:', error);
                if (error.status === 403) {
                    this.snackbarService.showError('Session expired. Please login again.');
                } else {
                    this.snackbarService.showError('Failed to load saved estimations');
                }
            }
        });
    }

    saveEstimation() {
        const estimation = {
            name: this.swpName || `SWP Estimation ${this.savedSwps.length + 1}`,
            total_investment: this.totalInvestment,
            withdrawal_per_month: this.withdrawalPerMonth,
            return_rate: this.expectedReturn,
            time_period: this.timePeriod,
            total_withdrawn: this.totalWithdrawn,
            final_value: this.finalValue
        };

        this.http.post<APIResponse>(`${this.apiUrl}/save`, estimation).subscribe({
            next: (response) => {
                if (response.success) {
                    this.snackbarService.showSuccess('Estimation saved successfully');
                    this.loadSavedSwps();
                }
            },
            error: (error) => {
                console.error('Error saving estimation:', error);
                if (error.status === 403) {
                    this.snackbarService.showError('Session expired. Please login again.');
                } else {
                    this.snackbarService.showError('Failed to save estimation');
                }
            }
        });
    }

    loadEstimation(swp: any) {
        this.swpName = swp.name;
        this.totalInvestment = swp.total_investment;
        this.withdrawalPerMonth = swp.withdrawal_per_month;
        this.expectedReturn = swp.return_rate;
        this.timePeriod = swp.time_period;
        this.calculate();
    }

    deleteEstimation(id: number, event: Event) {
        event.stopPropagation();
        if (confirm('Are you sure you want to delete this estimation?')) {
            this.http.delete<APIResponse>(`${this.apiUrl}/${id}`).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.snackbarService.showSuccess('Estimation deleted successfully');
                        this.loadSavedSwps();
                    }
                },
                error: (error) => {
                    console.error('Error deleting estimation:', error);
                    this.snackbarService.showError('Failed to delete estimation');
                }
            });
        }
    }

    calculate() {
        this.yearlyData = [];
        let balance = this.totalInvestment;
        let withdrawn = 0;
        const monthlyRate = this.expectedReturn / 12 / 100;

        // We simulate month by month
        for (let year = 1; year <= this.timePeriod; year++) {
            for (let m = 0; m < 12; m++) {
                // Interest is earned on the balance at the start of the month (or end, usually start for simplicity here or average)
                // Standard SWP: Withdraw first, then interest? Or Interest then withdraw?
                // Usually: Balance grows by interest, then withdrawal happens.
                // Or Withdrawal happens, then remaining balance grows.
                // Let's assume withdrawal at end of month.
                const interest = balance * monthlyRate;
                balance = balance + interest - this.withdrawalPerMonth;
                if (balance < 0) balance = 0;
                // If balance is 0, we stop withdrawing? Or we just count it as 0?
                // Usually SWP stops if no money.
                if (balance === 0 && this.withdrawalPerMonth > 0) {
                    // Partial withdrawal if we hit 0?
                    // For simplicity, let's just say it hits 0.
                }
            }
            // We accumulate total withdrawn simply as monthly * 12 * year, 
            // BUT if balance hit 0, we shouldn't have withdrawn that much.
            // Let's track actual withdrawn.

            // Re-doing loop to be more precise
        }

        // Reset for actual calculation loop
        balance = this.totalInvestment;
        withdrawn = 0;
        this.yearlyData = [];

        for (let year = 1; year <= this.timePeriod; year++) {
            let yearWithdrawn = 0;
            for (let m = 0; m < 12; m++) {
                if (balance > 0) {
                    const interest = balance * monthlyRate;
                    let amountToWithdraw = this.withdrawalPerMonth;
                    if (balance + interest < amountToWithdraw) {
                        amountToWithdraw = balance + interest;
                        balance = 0;
                    } else {
                        balance = balance + interest - amountToWithdraw;
                    }
                    withdrawn += amountToWithdraw;
                    yearWithdrawn += amountToWithdraw;
                }
            }
            this.yearlyData.push({
                year: year,
                balance: balance,
                withdrawn: withdrawn
            });
        }

        this.finalValue = balance;
        this.totalWithdrawn = withdrawn;
    }

    getGraphPath(): string {
        if (this.yearlyData.length === 0) return '';

        const width = 600;
        const height = 300;
        const padding = 40;

        // Max value could be initial investment or final value or max balance during the period (if return > withdrawal)
        // Usually max balance is the start or end.
        let maxVal = this.totalInvestment;
        this.yearlyData.forEach(d => {
            if (d.balance > maxVal) maxVal = d.balance;
        });

        // Also consider withdrawn amount? No, we usually plot Balance.
        // Maybe we plot Balance vs Total Withdrawn?
        // Let's plot Balance.

        const yScale = (height - 2 * padding) / maxVal;
        const xScaleAdj = (width - 2 * padding) / (this.yearlyData.length); // +1 for year 0

        // Start at Year 0
        const points = [{ year: 0, balance: this.totalInvestment }, ...this.yearlyData];

        let d = '';
        points.forEach((point, index) => {
            const x = padding + index * xScaleAdj;
            const y = height - padding - (point.balance * yScale);
            d += `${index === 0 ? 'M' : 'L'} ${x} ${y} `;
        });

        return d;
    }

    getAreaPath(): string {
        if (this.yearlyData.length === 0) return '';
        const width = 600;
        const height = 300;
        const padding = 40;

        let d = this.getGraphPath();

        // We need the last X coordinate
        const points = [{ year: 0, balance: this.totalInvestment }, ...this.yearlyData];
        const xScaleAdj = (width - 2 * padding) / (this.yearlyData.length);
        const lastX = padding + (points.length - 1) * xScaleAdj;

        const firstX = padding;
        const bottomY = height - padding;

        d += `L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
        return d;
    }
}
