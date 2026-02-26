import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  /**
   * Fetches a paginated list of projects from the backend.
   */
  getProjects(page = 1, limit = 10): Observable<ProjectResponse> {
    return this.http.get<ProjectResponse>(
      `${environment.serverUrl}/api/projects?page=${page}&limit=${limit}`,
    );
  }

  /**
   * Fetches internal metadata for a single project from the backend API.
   * Merges core repository data with a detailed language breakdown.
   */
  getProjectByName(name: string): Observable<Project> {
    return this.http.get<Project>(
      `${environment.serverUrl}/api/projects/${name}`,
    );
  }

  /**
   * Fetches analytical insights, badges, and commit activity for a project.
   */
  getProjectInsights(name: string): Observable<ProjectInsights> {
    return this.http.get<ProjectInsights>(
      `${environment.serverUrl}/api/projects/${name}/insights`,
    );
  }

  /**
   * Fetches the list of contributors for a project.
   */
  getProjectContributors(name: string): Observable<Contributor[]> {
    return this.http.get<Contributor[]>(
      `${environment.serverUrl}/api/projects/${name}/contributors`,
    );
  }

  /**
   * Searches repositories with server-side pagination and in-memory filtering.
   */
  searchProjects(
    query: string,
    page = 1,
    limit = 10,
  ): Observable<ProjectResponse> {
    return this.http.get<ProjectResponse>(
      `${environment.serverUrl}/api/projects/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    );
  }
}