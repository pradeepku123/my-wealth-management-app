import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MutualFund } from '../models/mutual-fund.model';

@Injectable({
    providedIn: 'root'
})
export class RecommendationsService {
    private readonly BASE_URL = 'recommendations';

    constructor(private apiService: ApiService) { }

    getRecommendedMutualFunds(): Observable<MutualFund[]> {
        return this.apiService.get<MutualFund[]>(`${this.BASE_URL}/mutual-funds`);
    }

    getFundDetails(schemeCode: string): Observable<any> {
        return this.apiService.get<any>(`${this.BASE_URL}/mutual-funds/${schemeCode}`);
    }

    searchFunds(query: string, limit: number = 20, offset: number = 0): Observable<any> {
        return this.apiService.get<any>(`${this.BASE_URL}/search?query=${query}&limit=${limit}&offset=${offset}`);
    }
}
