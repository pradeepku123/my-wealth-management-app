import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HttpClient } from '@angular/common/http';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';
import { SnackbarService } from '../services/snackbar.service';

@Component({
    selector: 'app-sip-calculator',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './sip-calculator.component.html',
    styleUrls: ['./sip-calculator.component.scss']
})
export class SipCalculatorComponent {
    sipName: string = '';
    sipType: 'Monthly' | 'Yearly' = 'Monthly';
    amount: number = 5000;
    expectedReturn: number = 12;
    timePeriod: number = 10;

    totalInvested: number = 0;
    estimatedReturns: number = 0;
    totalValue: number = 0;

    yearlyData: any[] = []; // Restored yearlyData
    savedSips: any[] = [];
    private apiUrl = '/api/v1/sip'; // Added apiUrl

    constructor(
        private http: HttpClient, // Injected HttpClient
        private errorHandler: ErrorHandlerService, // Injected ErrorHandlerService
        private snackbarService: SnackbarService // Injected SnackbarService
    ) {
        this.loadSavedSips();
        this.calculate();
    }

    loadSavedSips() {
        this.http.get<APIResponse>(`${this.apiUrl}/list`).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.savedSips = response.data;
                }
            },
            error: (error) => {
                console.error('Error loading SIP estimations:', error);
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
            name: this.sipName || `SIP Estimation ${this.savedSips.length + 1}`,
            sip_type: this.sipType,
            amount: this.amount,
            return_rate: this.expectedReturn,
            time_period: this.timePeriod,
            total_invested: this.totalInvested,
            estimated_returns: this.estimatedReturns,
            total_value: this.totalValue
        };

        this.http.post<APIResponse>(`${this.apiUrl}/save`, estimation).subscribe({
            next: (response) => {
                if (response.success) {
                    this.snackbarService.showSuccess('Estimation saved successfully');
                    this.loadSavedSips();
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

    loadEstimation(sip: any) {
        this.sipName = sip.name;
        this.sipType = sip.sip_type;
        this.amount = sip.amount;
        this.expectedReturn = sip.return_rate;
        this.timePeriod = sip.time_period;
        this.calculate();
    }

    deleteEstimation(id: number, event: Event) {
        event.stopPropagation();
        if (confirm('Are you sure you want to delete this estimation?')) {
            this.http.delete<APIResponse>(`${this.apiUrl}/${id}`).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.snackbarService.showSuccess('Estimation deleted successfully');
                        this.loadSavedSips();
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
        let invested = 0;
        let currentValue = 0;
        const rate = this.expectedReturn / 100;

        // Monthly calculation variables
        const monthlyRate = rate / 12;
        const months = this.timePeriod * 12;

        if (this.sipType === 'Monthly') {
            this.totalInvested = this.amount * months;
            // FV = P * [ (1+i)^n - 1 ] * (1+i) / i
            this.totalValue = this.amount * (Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate) / monthlyRate;

            // Generate yearly data for graph
            let currentCorpus = 0;
            for (let year = 1; year <= this.timePeriod; year++) {
                // Calculate value at end of each year
                // We can approximate or run a loop for months
                for (let m = 0; m < 12; m++) {
                    currentCorpus = (currentCorpus + this.amount) * (1 + monthlyRate);
                }
                this.yearlyData.push({
                    year: year,
                    invested: this.amount * 12 * year,
                    value: currentCorpus
                });
            }

        } else {
            // Yearly
            this.totalInvested = this.amount * this.timePeriod;
            // FV = P * [ (1+r)^n - 1 ] * (1+r) / r
            this.totalValue = this.amount * (Math.pow(1 + rate, this.timePeriod) - 1) * (1 + rate) / rate;

            let currentCorpus = 0;
            for (let year = 1; year <= this.timePeriod; year++) {
                currentCorpus = (currentCorpus + this.amount) * (1 + rate);
                this.yearlyData.push({
                    year: year,
                    invested: this.amount * year,
                    value: currentCorpus
                });
            }
        }

        this.estimatedReturns = this.totalValue - this.totalInvested;
    }

    getGraphPath(): string {
        if (this.yearlyData.length === 0) return '';

        const width = 600;
        const height = 300;
        const padding = 40;

        const maxVal = this.yearlyData[this.yearlyData.length - 1].value;
        const minVal = 0;

        const xScale = (width - 2 * padding) / (this.yearlyData.length - 1);
        const yScale = (height - 2 * padding) / maxVal;

        // Line for Total Value
        let path = `M ${padding} ${height - padding} `; // Start at 0,0 (bottom-left)

        // Actually, first point should be year 0? Or just start from year 1.
        // Let's start from year 1 at x = padding + xScale
        // Or better, include Year 0 (0,0)

        const points = [{ year: 0, value: 0 }, ...this.yearlyData];
        const xScaleAdj = (width - 2 * padding) / (points.length - 1);

        let d = '';
        points.forEach((point, index) => {
            const x = padding + index * xScaleAdj;
            const y = height - padding - (point.value * yScale);
            d += `${index === 0 ? 'M' : 'L'} ${x} ${y} `;
        });

        return d;
    }

    getInvestedPath(): string {
        if (this.yearlyData.length === 0) return '';

        const width = 600;
        const height = 300;
        const padding = 40;

        const maxVal = this.yearlyData[this.yearlyData.length - 1].value; // Scale based on max value to keep proportion

        const points = [{ year: 0, invested: 0 }, ...this.yearlyData];
        const xScaleAdj = (width - 2 * padding) / (points.length - 1);
        const yScale = (height - 2 * padding) / maxVal;

        let d = '';
        points.forEach((point, index) => {
            const x = padding + index * xScaleAdj;
            const y = height - padding - (point.invested * yScale);
            d += `${index === 0 ? 'M' : 'L'} ${x} ${y} `;
        });

        return d;
    }
    getAreaPath(): string {
        if (this.yearlyData.length === 0) return '';

        const width = 600;
        const height = 300;
        const padding = 40;

        const maxVal = this.yearlyData[this.yearlyData.length - 1].value;
        const yScale = (height - 2 * padding) / maxVal;

        // Get the line path first
        let d = this.getGraphPath();

        // Close the path to create an area
        // Start from the last point, go down to x-axis, then back to start x-axis
        const lastX = width - padding; // Assuming the last point is at the right edge minus padding
        const firstX = padding;
        const bottomY = height - padding;

        d += `L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

        return d;
    }

    getInvestedAreaPath(): string {
        if (this.yearlyData.length === 0) return '';

        const width = 600;
        const height = 300;
        const padding = 40;

        const maxVal = this.yearlyData[this.yearlyData.length - 1].value;
        const yScale = (height - 2 * padding) / maxVal;

        let d = this.getInvestedPath();

        const lastX = width - padding;
        const firstX = padding;
        const bottomY = height - padding;

        d += `L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

        return d;
    }
}
