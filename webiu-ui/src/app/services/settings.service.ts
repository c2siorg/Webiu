import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.serverUrl}/admin/settings`;

  getPublicSettings(): Observable<any> {
    return this.http.get<any>(`${environment.serverUrl}/admin/settings/public`);
  }

  getSettings(): Observable<any> {
    return this.http.get<any>(this.apiUrl, {
      withCredentials: true,
    });
  }

  updateSettings(settings: Record<string, any>): Observable<any> {
    return this.http.patch<any>(this.apiUrl, settings, {
      withCredentials: true,
    });
  }

  syncRepositories(): Observable<any> {
    return this.http.post<any>(`${environment.serverUrl}/api/v1/projects/sync`, {}, {
      withCredentials: true,
    });
  }
}
