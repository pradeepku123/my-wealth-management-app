import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';
import { SnackbarService } from '../services/snackbar.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
    selector: 'app-swp-calculator',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './swp-calculator.component.html',
    styleUrls: ['./swp-calculator.component.scss']
})
export class SwpCalculatorComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('swpChart') swpChartRef!: ElementRef;
    chart: any;

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

    ngAfterViewInit() {
        this.updateChart();
    }

    ngOnDestroy() {
        if (this.chart) {
            this.chart.destroy();
        }
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
        // Reset for actual calculation loop
        let balance = this.totalInvestment;
        let withdrawn = 0;
        this.yearlyData = [];
        const monthlyRate = this.expectedReturn / 12 / 100;

        // Add initial point (Year 0)
        this.yearlyData.push({
            year: 0,
            balance: this.totalInvestment,
            withdrawn: 0
        });

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
        this.updateChart();
    }

    updateChart() {
        if (!this.swpChartRef) return;

        const ctx = this.swpChartRef.nativeElement.getContext('2d');
        const labels = this.yearlyData.map(d => `Year ${d.year}`);
        const balanceData = this.yearlyData.map(d => d.balance);
        const withdrawnData = this.yearlyData.map(d => d.withdrawn);

        if (this.chart) {
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = balanceData;
            this.chart.data.datasets[1].data = withdrawnData;
            this.chart.update();
        } else {
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Balance',
                            data: balanceData,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Cumulative Withdrawn',
                            data: withdrawnData,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
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
}
