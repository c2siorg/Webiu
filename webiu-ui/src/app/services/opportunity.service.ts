import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Opportunity {
  id: string;
  title: string;
  opportunityType: string;
  shortDescription: string;
  fullDescription?: string;
  preferredStacks: string[];
  applyButtonText: string;
  applyUrl: string;
  status: string;
  opensAt?: string | null;
  closesAt?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class OpportunityService {
  private http = inject(HttpClient);
  private apiUrl = environment.serverUrl;

  getPublicOpportunities(): Observable<{ success: boolean; opportunities: Opportunity[] }> {
    return this.http.get<{ success: boolean; opportunities: Opportunity[] }>(
      `${this.apiUrl}/opportunities`
    );
  }

  getAdminOpportunities(): Observable<{ success: boolean; opportunities: Opportunity[] }> {
    return this.http.get<{ success: boolean; opportunities: Opportunity[] }>(
      `${this.apiUrl}/opportunities/admin`,
      { withCredentials: true }
    );
  }

  createOpportunity(payload: Partial<Opportunity>): Observable<{ success: boolean; opportunity: Opportunity }> {
    return this.http.post<{ success: boolean; opportunity: Opportunity }>(
      `${this.apiUrl}/opportunities`,
      payload,
      { withCredentials: true }
    );
  }

  updateOpportunity(id: string, payload: Partial<Opportunity>): Observable<{ success: boolean; opportunity: Opportunity }> {
    return this.http.put<{ success: boolean; opportunity: Opportunity }>(
      `${this.apiUrl}/opportunities/${id}`,
      payload,
      { withCredentials: true }
    );
  }

  deleteOpportunity(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/opportunities/${id}`,
      { withCredentials: true }
    );
  }

  reorderOpportunities(orderedIds: string[]): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/opportunities/reorder`,
      { orderedIds },
      { withCredentials: true }
    );
  }
}
