import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APIResponse } from './api-response.interface';

export interface FundInput {
    name: string;
    allocationAmount: number;
    expectedGrowthRate: number;
    withdrawalRate: number;
    taxCategory: 'Equity' | 'Debt' | 'Other';
}

export interface RebalancingRule {
    sourceFundIndex: number;
    destinationFundIndex: number;
    amount: number;
    percentageAmount?: number;
    frequency: number;
    isShortfallBased?: boolean;
    shortfallYears?: number;
}

export interface RetirementPlan {
    id?: number;
    name: string;
    start_age: number;
    end_age: number;
    inflation_rate: number;
    total_corpus: number;
    funds: FundInput[];
    rebalancing_rules: RebalancingRule[];
}

@Injectable({
    providedIn: 'root'
})
export class RetirementService {
    private apiUrl = '/api/v1/retirement';

    constructor(private http: HttpClient) { }

    getPlans(): Observable<APIResponse<RetirementPlan[]>> {
        return this.http.get<APIResponse<RetirementPlan[]>>(`${this.apiUrl}/`);
    }

    savePlan(plan: RetirementPlan): Observable<APIResponse<RetirementPlan>> {
        return this.http.post<APIResponse<RetirementPlan>>(`${this.apiUrl}/`, plan);
    }

    deletePlan(id: number): Observable<APIResponse<RetirementPlan>> {
        return this.http.delete<APIResponse<RetirementPlan>>(`${this.apiUrl}/${id}`);
    }
}
