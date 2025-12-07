import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APIResponse } from './api-response.interface';

export interface FactSheetAnalysis {
    // 1. Basics
    fund_name?: string;
    plan_name?: string;
    investment_objective?: string;
    scheme_type?: string;
    inception_date?: string;
    benchmark?: string;

    // 2. Performance
    nav?: string;
    cagr?: { [key: string]: string };
    sip_returns?: { [key: string]: string };
    rolling_returns?: Array<{ period: string, avg: string }>;

    // 3. Risk
    risk_metrics?: { [key: string]: string }; // Std Dev, Beta, Sharpe, Alpha
    riskometer?: string;

    // 4. Costs
    expense_ratio?: string;
    expense_ratio_direct?: string;
    expense_ratio_regular?: string;

    // 5. Portfolio
    top_holdings?: Array<{ name: string, allocation: string }>;
    sector_allocation?: Array<{ sector: string, allocation: string }>;
    turnover_ratio?: string;

    // 6. Size
    net_assets?: string;

    // 7. Liquidity / Exit
    min_investment_sip?: string;
    min_investment_lumpsum?: string;
    exit_load?: string;

    // 8. Governance
    fund_manager?: string;
    insider_holdings?: string;

    raw_text?: string;
}

@Injectable({
    providedIn: 'root'
})
export class FundService {
    private apiUrl = '/api/v1/funds';

    constructor(private http: HttpClient) { }

    analyzeFactSheet(file: File): Observable<APIResponse<FactSheetAnalysis>> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<APIResponse<FactSheetAnalysis>>(`${this.apiUrl}/analyze/factsheet`, formData);
    }
}
