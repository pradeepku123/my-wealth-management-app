import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Goal } from '../models/goal';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class GoalService {
    private endpoint = 'goals';

    constructor(private apiService: ApiService) { }

    getGoals(): Observable<Goal[]> {
        return this.apiService.get<Goal[]>(this.endpoint);
    }

    createGoal(goal: Goal): Observable<Goal> {
        return this.apiService.post<Goal>(this.endpoint, goal);
    }

    linkInvestments(goalId: number, investmentIds: number[]): Observable<Goal> {
        return this.apiService.put<Goal>(`${this.endpoint}/${goalId}/link-investments`, { investment_ids: investmentIds });
    }
}
