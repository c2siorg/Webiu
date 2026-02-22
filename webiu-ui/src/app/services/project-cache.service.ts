import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProjectResponse } from '../page/projects/project.model';

@Injectable({
    providedIn: 'root',
})
export class ProjectCacheService {
    private cache$: Observable<ProjectResponse> | null = null;
    private http = inject(HttpClient);

    getProjects(page: number = 1, limit: number = 10): Observable<ProjectResponse> {
      return this.http.get<ProjectResponse>(
        `${environment.serverUrl}/api/projects/projects?page=${page}&limit=${limit}`
      );
    }

    clearCache(): void {
        this.cache$ = null;
    }
}
