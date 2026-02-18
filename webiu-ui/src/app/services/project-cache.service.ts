import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProjectResponse {
    repositories: any[];
}

@Injectable({
    providedIn: 'root',
})
export class ProjectCacheService {
    private cache$: Observable<ProjectResponse> | null = null;

    constructor(private http: HttpClient) { }

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