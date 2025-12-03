import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { HttpClient } from '@angular/common/http';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';
import { SnackbarService } from '../services/snackbar.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
    selector: 'app-sip-calculator',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './sip-calculator.component.html',
    styleUrls: ['./sip-calculator.component.scss']
})
export class SipCalculatorComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('sipChart') sipChartRef!: ElementRef;
    chart: any;

    sipName: string = '';
    sipType: 'Monthly' | 'Yearly' = 'Monthly';
    amount: number = 5000;
    expectedReturn: number = 12;
    timePeriod: number = 10;

    totalInvested: number = 0;
    estimatedReturns: number = 0;
    totalValue: number = 0;

    yearlyData: any[] = [];
    savedSips: any[] = [];
    private apiUrl = '/api/v1/sip';

    constructor(
        private http: HttpClient,
        private errorHandler: ErrorHandlerService,
        private snackbarService: SnackbarService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadSavedSips();
        this.calculate();
    }

    ngAfterViewInit() {
        this.updateChart();
    }

    ngOnDestroy() {
        if (this.chart) {
            this.chart.destroy();
        }
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
        this.updateChart();
    }

    updateChart() {
        if (!this.sipChartRef) return;

        const ctx = this.sipChartRef.nativeElement.getContext('2d');
        const labels = this.yearlyData.map(d => `Year ${d.year}`);
        const investedData = this.yearlyData.map(d => d.invested);
        const valueData = this.yearlyData.map(d => d.value);

        if (this.chart) {
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = investedData;
            this.chart.data.datasets[1].data = valueData;
            this.chart.update();
        } else {
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Invested Amount',
                            data: investedData,
                            borderColor: '#94a3b8',
                            backgroundColor: 'rgba(148, 163, 184, 0.2)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Total Value',
                            data: valueData,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(context.parsed.y);
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function (value, index, values) {
                                    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(Number(value));
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    navigateToSwp() {
        this.router.navigate(['/swp'], { queryParams: { investment: Math.round(this.totalValue) } });
    }
}
