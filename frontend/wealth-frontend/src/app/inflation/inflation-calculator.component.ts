import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
    selector: 'app-inflation-calculator',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './inflation-calculator.component.html',
    styleUrls: ['./inflation-calculator.component.scss']
})
export class InflationCalculatorComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('inflationChart') inflationChartRef!: ElementRef;
    chart: any;

    currentMonthlySalary: number = 100000;
    currentMonthlyExpense: number = 50000;
    currentAge: number = 25;
    retirementAge: number = 60;
    inflationRate: number = 6;
    salaryGrowthRate: number = 8;

    // For "How much to save" - Retirement Corpus calculation
    lifeExpectancy: number = 80;
    expectedInvestmentReturn: number = 12;

    yearlyData: any[] = [];
    expenseAtRetirement: number = 0;
    salaryAtRetirement: number = 0;
    corpusNeeded: number = 0;
    sipNeeded: number = 0;

    ngOnInit() {
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

    calculate() {
        this.yearlyData = [];
        let salary = this.currentMonthlySalary;
        let expense = this.currentMonthlyExpense;
        const yearsToRetire = this.retirementAge - this.currentAge;

        for (let year = 0; year <= yearsToRetire; year++) {
            this.yearlyData.push({
                year: this.currentAge + year,
                salary: Math.round(salary),
                expense: Math.round(expense),
                savings: Math.round(salary - expense)
            });

            salary = salary * (1 + this.salaryGrowthRate / 100);
            expense = expense * (1 + this.inflationRate / 100);
        }

        this.salaryAtRetirement = this.yearlyData[this.yearlyData.length - 1].salary;
        this.expenseAtRetirement = this.yearlyData[this.yearlyData.length - 1].expense;

        this.calculateRetirementNeeds();
        this.updateChart();
    }

    calculateRetirementNeeds() {
        // Simple Corpus Calculation:
        // Expenses at retirement (monthly) * 12 * (Life Expectancy - Retirement Age)
        // This is a simplified view ignoring post-retirement inflation vs returns for now, 
        // or we can use a real PV formula.

        // Let's use a slightly better formula:
        // Corpus required to support monthly expense 'E' for 'N' years, 
        // assuming corpus grows at 'R' (conservative post-retirement return, say 8%) 
        // and inflation 'I' (6%).
        // Real Rate of Return (RR) = (1+R)/(1+I) - 1.

        const postRetirementReturn = 8; // Conservative
        const inflation = this.inflationRate;
        const yearsInRetirement = this.lifeExpectancy - this.retirementAge;

        // Monthly Expense at start of retirement
        const E = this.expenseAtRetirement;

        // Real rate
        const r_real = ((1 + postRetirementReturn / 100) / (1 + inflation / 100)) - 1;

        // PV of an annuity with growth (inflation) is complex if we use nominal rates.
        // Using Real Rate simplifies it to PV of annuity.
        // Corpus = E * 12 * [ (1 - (1+r)^-n) / r ]

        if (r_real === 0) {
            this.corpusNeeded = E * 12 * yearsInRetirement;
        } else {
            this.corpusNeeded = E * 12 * ((1 - Math.pow(1 + r_real, -yearsInRetirement)) / r_real);
        }

        // Now, how much SIP to reach this Corpus?
        // FV = P * [ (1+i)^n - 1 ] * (1+i)/i
        // We need P.
        // P = FV / ( [ (1+i)^n - 1 ] * (1+i)/i )

        const yearsToInvest = this.retirementAge - this.currentAge;
        const monthlyRate = this.expectedInvestmentReturn / 12 / 100;
        const months = yearsToInvest * 12;

        if (monthlyRate === 0) {
            this.sipNeeded = this.corpusNeeded / months;
        } else {
            const factor = (Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate) / monthlyRate;
            this.sipNeeded = this.corpusNeeded / factor;
        }
    }

    updateChart() {
        if (!this.inflationChartRef) return;

        const ctx = this.inflationChartRef.nativeElement.getContext('2d');
        const labels = this.yearlyData.map(d => `Age ${d.year}`);
        const salaryData = this.yearlyData.map(d => d.salary);
        const expenseData = this.yearlyData.map(d => d.expense);

        if (this.chart) {
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = salaryData;
            this.chart.data.datasets[1].data = expenseData;
            this.chart.update();
        } else {
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Monthly Salary',
                            data: salaryData,
                            borderColor: '#198754', // Success color
                            backgroundColor: 'rgba(25, 135, 84, 0.1)',
                            fill: false,
                            tension: 0.4
                        },
                        {
                            label: 'Monthly Expense',
                            data: expenseData,
                            borderColor: '#dc3545', // Danger color
                            backgroundColor: 'rgba(220, 53, 69, 0.1)',
                            fill: false,
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
