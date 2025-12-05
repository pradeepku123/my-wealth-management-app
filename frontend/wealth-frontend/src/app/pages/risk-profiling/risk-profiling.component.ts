import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-risk-profiling',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './risk-profiling.component.html',
    styleUrls: ['./risk-profiling.component.scss']
})
export class RiskProfilingComponent implements OnInit {
    currentStep = 0;
    questions = [
        {
            id: 'age',
            text: 'What is your age group?',
            options: [
                { label: 'Under 30', value: 4 },
                { label: '30 - 45', value: 3 },
                { label: '45 - 60', value: 2 },
                { label: 'Above 60', value: 1 }
            ]
        },
        {
            id: 'horizon',
            text: 'What is your investment horizon?',
            options: [
                { label: 'More than 10 years', value: 4 },
                { label: '5 - 10 years', value: 3 },
                { label: '3 - 5 years', value: 2 },
                { label: 'Less than 3 years', value: 1 }
            ]
        },
        {
            id: 'drop',
            text: 'How would you react if your portfolio drops by 20%?',
            options: [
                { label: 'Buy more (Opportunity)', value: 4 },
                { label: 'Hold (Wait it out)', value: 3 },
                { label: 'Sell some (Cut losses)', value: 2 },
                { label: 'Sell all (Panic)', value: 1 }
            ]
        },
        {
            id: 'goal',
            text: 'What is your primary financial goal?',
            options: [
                { label: 'Wealth Accumulation', value: 4 },
                { label: 'Capital Growth', value: 3 },
                { label: 'Income & Growth', value: 2 },
                { label: 'Capital Preservation', value: 1 }
            ]
        },
        {
            id: 'knowledge',
            text: 'How would you describe your investment knowledge?',
            options: [
                { label: 'Expert', value: 4 },
                { label: 'Good', value: 3 },
                { label: 'Basic', value: 2 },
                { label: 'None', value: 1 }
            ]
        }
    ];

    answers: any = {};
    result: any = null;
    isLoading = false;
    error: string | null = null;

    constructor(private apiService: ApiService) { }

    ngOnInit() {
        this.fetchRiskProfile();
    }

    fetchRiskProfile() {
        this.isLoading = true;
        this.apiService.get('risk-profile').subscribe({
            next: (data: any) => {
                if (data) {
                    this.result = data;
                    this.answers = data.answers || {};
                }
                this.isLoading = false;
            },
            error: (err) => {
                // 404 is expected if no profile exists
                this.isLoading = false;
            }
        });
    }

    selectOption(questionId: string, value: number) {
        this.answers[questionId] = value;
    }

    nextStep() {
        if (this.currentStep < this.questions.length - 1) {
            this.currentStep++;
        } else {
            this.submitProfile();
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
        }
    }

    submitProfile() {
        console.log('Submitting profile with answers:', this.answers);
        this.isLoading = true;
        this.apiService.post('risk-profile', { answers: this.answers }).subscribe({
            next: (data: any) => {
                if (data) {
                    this.result = data;
                }
                this.isLoading = false;
            },
            error: (err) => {
                this.error = 'Failed to submit risk profile';
                this.isLoading = false;
            }
        });
    }

    retake() {
        this.result = null;
        this.currentStep = 0;
        this.answers = {};
    }

    get currentQuestion() {
        return this.questions[this.currentStep];
    }

    isOptionSelected(value: number): boolean {
        return this.answers[this.currentQuestion.id] === value;
    }
}
