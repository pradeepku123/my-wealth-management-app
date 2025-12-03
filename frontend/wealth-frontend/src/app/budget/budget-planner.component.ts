import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';
import { SnackbarService } from '../services/snackbar.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface BudgetItem {
    category_name: string;
    amount: number;
}

interface Budget {
    id?: number;
    name: string;
    monthly_income: number;
    items: BudgetItem[];
    created_at?: string;
}

@Component({
    selector: 'app-budget-planner',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './budget-planner.component.html',
    styleUrls: ['./budget-planner.component.scss']
})
export class BudgetPlannerComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('budgetChart') budgetChartRef!: ElementRef;
    chart: any;

    budgetName: string = '';
    monthlyIncome: number = 50000;

    // Default categories
    expenseItems: BudgetItem[] = [
        { category_name: 'Rent/Housing', amount: 15000 },
        { category_name: 'Food/Groceries', amount: 8000 },
        { category_name: 'Transport', amount: 3000 },
        { category_name: 'Utilities', amount: 2000 },
        { category_name: 'Entertainment', amount: 2000 }
    ];

    totalExpense: number = 0;
    netSavings: number = 0;

    savedBudgets: Budget[] = [];
    currentBudgetId: number | null = null;
    private apiUrl = '/api/v1/budget';

    constructor(
        private http: HttpClient,
        private errorHandler: ErrorHandlerService,
        private snackbarService: SnackbarService
    ) { }

    ngOnInit() {
        this.calculate();
        this.loadSavedBudgets();
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
        this.totalExpense = this.expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        this.netSavings = this.monthlyIncome - this.totalExpense;
        this.updateChart();
    }

    addExpenseItem() {
        this.expenseItems.push({ category_name: '', amount: 0 });
    }

    removeExpenseItem(index: number) {
        this.expenseItems.splice(index, 1);
        this.calculate();
    }

    loadSavedBudgets() {
        this.http.get<APIResponse>(`${this.apiUrl}/list`).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.savedBudgets = response.data;
                }
            },
            error: (error) => {
                console.error('Error loading budgets:', error);
                this.snackbarService.showError('Failed to load saved budgets');
            }
        });
    }

    saveBudget() {
        if (!this.budgetName) {
            this.budgetName = `Budget Plan ${this.savedBudgets.length + 1}`;
        }

        const budgetPayload: Budget = {
            name: this.budgetName,
            monthly_income: this.monthlyIncome,
            items: this.expenseItems
        };

        if (this.currentBudgetId) {
            // Update
            this.http.put<APIResponse>(`${this.apiUrl}/${this.currentBudgetId}`, budgetPayload).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.snackbarService.showSuccess('Budget updated successfully');
                        this.loadSavedBudgets();
                    }
                },
                error: (error) => {
                    console.error('Error updating budget:', error);
                    this.snackbarService.showError('Failed to update budget');
                }
            });
        } else {
            // Create
            this.http.post<APIResponse>(`${this.apiUrl}/save`, budgetPayload).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.snackbarService.showSuccess('Budget saved successfully');
                        this.loadSavedBudgets();
                        this.currentBudgetId = response.data.id;
                    }
                },
                error: (error) => {
                    console.error('Error saving budget:', error);
                    this.snackbarService.showError('Failed to save budget');
                }
            });
        }
    }

    loadBudget(budget: Budget) {
        this.currentBudgetId = budget.id!;
        this.budgetName = budget.name;
        this.monthlyIncome = budget.monthly_income;
        // Deep copy items to avoid reference issues
        this.expenseItems = budget.items.map(item => ({ ...item }));
        this.calculate();
    }

    deleteBudget(id: number, event: Event) {
        event.stopPropagation();
        if (confirm('Are you sure you want to delete this budget?')) {
            this.http.delete<APIResponse>(`${this.apiUrl}/${id}`).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.snackbarService.showSuccess('Budget deleted successfully');
                        this.loadSavedBudgets();
                        if (this.currentBudgetId === id) {
                            this.resetForm();
                        }
                    }
                },
                error: (error) => {
                    console.error('Error deleting budget:', error);
                    this.snackbarService.showError('Failed to delete budget');
                }
            });
        }
    }

    resetForm() {
        this.currentBudgetId = null;
        this.budgetName = '';
        this.monthlyIncome = 50000;
        this.expenseItems = [
            { category_name: 'Rent/Housing', amount: 15000 },
            { category_name: 'Food/Groceries', amount: 8000 },
            { category_name: 'Transport', amount: 3000 },
            { category_name: 'Utilities', amount: 2000 },
            { category_name: 'Entertainment', amount: 2000 }
        ];
        this.calculate();
    }

    updateChart() {
        if (!this.budgetChartRef) return;

        const ctx = this.budgetChartRef.nativeElement.getContext('2d');

        // Filter out empty items
        const validItems = this.expenseItems.filter(item => item.amount > 0);
        const labels = validItems.map(item => item.category_name || 'Uncategorized');
        const data = validItems.map(item => item.amount);

        // Add Savings if positive
        if (this.netSavings > 0) {
            labels.push('Savings');
            data.push(this.netSavings);
        }

        const colors = [
            '#dc3545', '#fd7e14', '#ffc107', '#20c997', '#0dcaf0',
            '#6610f2', '#d63384', '#6f42c1', '#0d6efd', '#198754'
        ];

        // If savings is the last item, ensure it gets a green color (e.g. last in our list or specific)
        // Let's just generate colors cyclically, but maybe override the last one if it is Savings?
        const backgroundColors = labels.map((label, index) => {
            if (label === 'Savings') return '#198754'; // Success Green
            return colors[index % colors.length];
        });

        if (this.chart) {
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = data;
            this.chart.data.datasets[0].backgroundColor = backgroundColors;
            this.chart.update();
        } else {
            this.chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                boxWidth: 12
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed !== null) {
                                        label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(context.parsed);
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
    }
}
