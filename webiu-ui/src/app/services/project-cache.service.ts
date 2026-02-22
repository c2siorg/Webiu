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

    getProjects(): Observable<ProjectResponse> {
        if (!this.cache$) {
            this.cache$ = this.http
                .get<ProjectResponse>(
                    `${environment.serverUrl}/api/projects/projects`,
                )
                .pipe(shareReplay(1));
        }
        return this.cache$;
    }

    clearCache(): void {
        this.cache$ = null;
    }
}