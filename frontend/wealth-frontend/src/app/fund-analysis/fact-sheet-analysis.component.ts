import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FundService, FactSheetAnalysis } from '../services/fund.service';
import { APIResponse } from '../services/api-response.interface';

@Component({
    selector: 'app-fact-sheet-analysis',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './fact-sheet-analysis.component.html',
    styleUrls: ['./fact-sheet-analysis.component.scss']
})
export class FactSheetAnalysisComponent {
    selectedFile: File | null = null;
    analysisResult: FactSheetAnalysis | null = null;
    isLoading = false;
    error: string | null = null;
    elapsedTime = 0;
    private timerInterval: any;

    constructor(private fundService: FundService) { }

    onFileSelected(event: any) {
        this.selectedFile = event.target.files[0] ?? null;
        this.analysisResult = null;
        this.error = null;
    }

    analyze() {
        if (!this.selectedFile) return;

        this.isLoading = true;
        this.error = null;
        this.elapsedTime = 0;
        this.startTimer();

        this.fundService.analyzeFactSheet(this.selectedFile).subscribe({
            next: (res: APIResponse<FactSheetAnalysis>) => {
                this.isLoading = false;
                this.stopTimer();
                if (res.success && res.data) {
                    this.analysisResult = res.data;
                } else {
                    this.error = res.message || "Failed to analyze";
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.stopTimer();
                // Handle different error structures
                if (typeof err.error === 'string') {
                    this.error = err.error;
                } else if (err.error && err.error.detail) {
                    this.error = err.error.detail;
                } else if (err.message) {
                    this.error = err.message;
                } else {
                    this.error = 'Analysis failed. Please try again.';
                }
                console.error('Fact sheet analysis error:', err);
            }
        });
    }

    reset() {
        this.selectedFile = null;
        this.analysisResult = null;
        this.error = null;
        this.stopTimer();
        this.elapsedTime = 0;
    }

    private startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.elapsedTime++;
        }, 1000);
    }

    private stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    get formattedTime(): string {
        const minutes = Math.floor(this.elapsedTime / 60);
        const seconds = this.elapsedTime % 60;
        return `${minutes}m ${seconds}s`;
    }

    getObjectKeys(obj: any): string[] {
        return obj ? Object.keys(obj) : [];
    }
}
