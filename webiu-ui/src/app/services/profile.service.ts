import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private http = inject(HttpClient);
  private apiUrl = environment.serverUrl;

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/profile`, {
      withCredentials: true,
    });
  }

  updateUsername(username: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/admin/profile/username`,
      { username },
      { withCredentials: true }
    );
  }

  updatePassword(data: any): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/admin/profile/password`,
      data,
      { withCredentials: true }
    );
  }
}
