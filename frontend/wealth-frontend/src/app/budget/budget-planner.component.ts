import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';
import { SnackbarService } from '../services/snackbar.service';

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
export class BudgetPlannerComponent implements OnInit {
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

    calculate() {
        this.totalExpense = this.expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        this.netSavings = this.monthlyIncome - this.totalExpense;
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

    // Pie Chart Logic
    getPieChartPath(index: number, total: number): string {
        // Simple pie chart implementation is complex in pure SVG without libraries.
        // Let's use a simple bar chart or just a CSS conic-gradient for simplicity if possible, 
        // OR implement a basic SVG pie chart.
        // Given the constraints, let's do a simple horizontal stacked bar chart for "Income vs Expenses"
        return '';
    }

    // Helper for Pie Chart
    getPieSlices() {
        let cumulativePercent = 0;
        const total = this.totalExpense > 0 ? this.totalExpense : 1;

        return this.expenseItems.map((item, index) => {
            const percent = (item.amount / total);
            const startPercent = cumulativePercent;
            cumulativePercent += percent;

            const startX = Math.cos(2 * Math.PI * startPercent);
            const startY = Math.sin(2 * Math.PI * startPercent);
            const endX = Math.cos(2 * Math.PI * cumulativePercent);
            const endY = Math.sin(2 * Math.PI * cumulativePercent);

            // Large arc flag
            const largeArcFlag = percent > 0.5 ? 1 : 0;

            // Path data
            // M 0 0 L startX startY A 1 1 0 largeArcFlag 1 endX endY Z
            // We need to scale this to our SVG size (e.g. 100x100, center 50,50, radius 40)

            return {
                path: this.createPieSlicePath(50, 50, 40, startPercent, cumulativePercent),
                color: this.getColor(index),
                label: item.category_name,
                percent: (percent * 100).toFixed(1)
            };
        });
    }

    createPieSlicePath(cx: number, cy: number, r: number, startPercent: number, endPercent: number): string {
        const startX = cx + r * Math.cos(2 * Math.PI * startPercent - Math.PI / 2); // -PI/2 to start at top
        const startY = cy + r * Math.sin(2 * Math.PI * startPercent - Math.PI / 2);
        const endX = cx + r * Math.cos(2 * Math.PI * endPercent - Math.PI / 2);
        const endY = cy + r * Math.sin(2 * Math.PI * endPercent - Math.PI / 2);

        const largeArcFlag = (endPercent - startPercent) > 0.5 ? 1 : 0;

        return `M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
    }

    getColor(index: number): string {
        const colors = ['#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545', '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0'];
        return colors[index % colors.length];
    }
}
