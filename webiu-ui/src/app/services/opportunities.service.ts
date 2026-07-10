import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Opportunity {
  _id?: string;
  title: string;
  opportunityType: string;
  organization: string;
  description: string;
  requirements: string[];
  applyButtonText: string;
  applyDestinationUrl: string;
  status: 'Draft' | 'Published' | 'Closed';
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OpportunitiesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.serverUrl}/api/opportunities`;

  getPublishedOpenings(): Observable<Opportunity[]> {
    return this.http.get<Opportunity[]>(this.apiUrl);
  }

  getAllOpeningsAdmin(): Observable<Opportunity[]> {
    return this.http.get<Opportunity[]>(`${this.apiUrl}/admin`);
  }

  getOne(id: string): Observable<Opportunity> {
    return this.http.get<Opportunity>(`${this.apiUrl}/${id}`);
  }

  createOpening(opp: Partial<Opportunity>): Observable<Opportunity> {
    return this.http.post<Opportunity>(this.apiUrl, opp);
  }

  updateOpening(id: string, opp: Partial<Opportunity>): Observable<Opportunity> {
    return this.http.put<Opportunity>(`${this.apiUrl}/${id}`, opp);
  }

  deleteOpening(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/${id}`);
  }
}
