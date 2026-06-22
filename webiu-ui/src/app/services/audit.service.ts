import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.serverUrl}/admin/audit`;

  getAuditLogs(filters: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<any> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.action) params = params.set('action', filters.action);
    if (filters.entityType) params = params.set('entityType', filters.entityType);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);

    return this.http.get<any>(this.apiUrl, {
      params,
      withCredentials: true,
    });
  }

  getAuditLogDetails(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      withCredentials: true,
    });
  }
}
