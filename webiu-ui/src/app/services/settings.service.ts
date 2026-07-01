import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.serverUrl}/admin/settings`;
  private publicSettings$: Observable<any> | null = null;

  getPublicSettings(): Observable<any> {
    if (!this.publicSettings$) {
      this.publicSettings$ = this.http.get<any>(`${environment.serverUrl}/admin/settings/public`).pipe(
        shareReplay(1)
      );
    }
    return this.publicSettings$;
  }

  getSettings(): Observable<any> {
    return this.http.get<any>(this.apiUrl, {
      withCredentials: true,
    });
  }

  updateSettings(settings: Record<string, any>): Observable<any> {
    this.publicSettings$ = null;
    return this.http.patch<any>(this.apiUrl, settings, {
      withCredentials: true,
    });
  }

  syncRepositories(): Observable<any> {
    return this.http.post<any>(`${environment.serverUrl}/api/v1/projects/sync`, {}, {
      withCredentials: true,
    });
  }

  getDashboardSummary(): Observable<any> {
    return this.http.get<any>(`${environment.serverUrl}/admin/dashboard`, {
      withCredentials: true,
    });
  }

  getContributorAnalytics(): Observable<any> {
    return this.http.get<any>(`${environment.serverUrl}/admin/contributors`, {
      withCredentials: true,
    });
  }

  getRepositoryAnalytics(): Observable<any> {
    return this.http.get<any>(`${environment.serverUrl}/admin/repositories`, {
      withCredentials: true,
    });
  }
}
