import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Project,
  ProjectInsights,
  ProjectResponse,
  Contributor,
} from '../page/projects/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectCacheService {
  private http = inject(HttpClient);
  private cache = new Map<string, any>();

  /**
   * Fetches a paginated list of projects from the backend, using client-side cache.
   */
  getProjects(page = 1, limit = 10): Observable<ProjectResponse> {
    const cacheKey = `projects_${page}_${limit}`;
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }
    return this.http.get<ProjectResponse>(
      `${environment.serverUrl}/api/v1/projects?page=${page}&limit=${limit}`,
    ).pipe(
      tap((res) => this.cache.set(cacheKey, res))
    );
  }

  /**
   * Fetches internal metadata for a single project, using client-side cache.
   */
  getProjectByName(name: string): Observable<Project> {
    const cacheKey = `project_name_${name}`;
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }
    return this.http.get<Project>(
      `${environment.serverUrl}/api/v1/projects/${name}`,
    ).pipe(
      tap((res) => this.cache.set(cacheKey, res))
    );
  }

  /**
   * Fetches analytical insights, using client-side cache.
   */
  getProjectInsights(name: string): Observable<ProjectInsights> {
    const cacheKey = `project_insights_${name}`;
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }
    return this.http.get<ProjectInsights>(
      `${environment.serverUrl}/api/v1/projects/${name}/insights`,
    ).pipe(
      tap((res) => this.cache.set(cacheKey, res))
    );
  }

  /**
   * Fetches project contributors, using client-side cache.
   */
  getProjectContributors(name: string): Observable<Contributor[]> {
    const cacheKey = `project_contributors_${name}`;
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }
    return this.http.get<Contributor[]>(
      `${environment.serverUrl}/api/v1/projects/${name}/contributors`,
    ).pipe(
      tap((res) => this.cache.set(cacheKey, res))
    );
  }

  /**
   * Searches repositories with pagination, using client-side cache.
   */
  searchProjects(
    query: string,
    page = 1,
    limit = 10,
  ): Observable<ProjectResponse> {
    const cacheKey = `projects_search_${query}_${page}_${limit}`;
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }
    return this.http.get<ProjectResponse>(
      `${environment.serverUrl}/api/v1/projects/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    ).pipe(
      tap((res) => this.cache.set(cacheKey, res))
    );
  }

  /**
   * Fetches the static fallback backup of projects.
   */
  getFallbackProjects(): Observable<ProjectResponse> {
    const cacheKey = 'fallback_projects';
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }
    return this.http.get<ProjectResponse>('assets/data/projects.json').pipe(
      tap((res) => this.cache.set(cacheKey, res))
    );
  }

  /**
   * Clears the client-side cache.
   */
  clearCache(): void {
    this.cache.clear();
  }
}