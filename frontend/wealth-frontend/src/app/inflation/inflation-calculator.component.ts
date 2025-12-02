import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-inflation-calculator',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './inflation-calculator.component.html',
    styleUrls: ['./inflation-calculator.component.scss']
})
export class InflationCalculatorComponent implements OnInit {
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

    getGraphPath(type: 'salary' | 'expense'): string {
        if (this.yearlyData.length === 0) return '';

        const width = 600;
        const height = 300;
        const padding = 40;

        // Find max value for scaling
        let maxVal = 0;
        this.yearlyData.forEach(d => {
            if (d.salary > maxVal) maxVal = d.salary;
            if (d.expense > maxVal) maxVal = d.expense;
        });

        const yScale = (height - 2 * padding) / maxVal;
        const xScaleAdj = (width - 2 * padding) / (this.yearlyData.length - 1);

        let d = '';
        this.yearlyData.forEach((point, index) => {
            const val = type === 'salary' ? point.salary : point.expense;
            const x = padding + index * xScaleAdj;
            const y = height - padding - (val * yScale);
            d += `${index === 0 ? 'M' : 'L'} ${x} ${y} `;
        });

        return d;
    }
}
