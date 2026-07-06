import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GsocProgram {
  id: string;
  year: number;
  title: string;
  description?: string;
  heroImageUrl?: string;
  introHtml?: string;
  slackUrl?: string;
  proposalTemplateUrl?: string;
  githubOrgUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GsocMentor {
  id: string;
  name: string;
  githubHandle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GsocIdea {
  id: string;
  programId: string;
  projectNumber: number;
  title: string;
  explanation: string;
  expectedResults?: string;
  prerequisites?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  durationHours: number;
  slackChannel?: string;
  githubUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  mentors: GsocMentor[];
}

@Injectable({
  providedIn: 'root',
})
export class GsocService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.serverUrl}/admin/gsoc`;
  private publicUrl = `${environment.serverUrl}/gsoc`;

  private httpOptions = {
    withCredentials: true,
  };

  // --- Public Endpoints ---
  getCurrentProgram(): Observable<{ success: boolean; program: GsocProgram }> {
    return this.http.get<{ success: boolean; program: GsocProgram }>(
      `${this.publicUrl}/current`
    );
  }

  getCurrentIdeas(): Observable<{ success: boolean; ideas: GsocIdea[] }> {
    return this.http.get<{ success: boolean; ideas: GsocIdea[] }>(
      `${this.publicUrl}/current/ideas`
    );
  }

  // --- Admin Programs Endpoints ---
  getPrograms(): Observable<{ success: boolean; programs: GsocProgram[] }> {
    return this.http.get<{ success: boolean; programs: GsocProgram[] }>(
      `${this.adminUrl}/programs`,
      this.httpOptions
    );
  }

  createProgram(dto: Partial<GsocProgram>): Observable<{ success: boolean; program: GsocProgram; message?: string }> {
    return this.http.post<{ success: boolean; program: GsocProgram; message?: string }>(
      `${this.adminUrl}/programs`,
      dto,
      this.httpOptions
    );
  }

  updateProgram(id: string, dto: Partial<GsocProgram>): Observable<{ success: boolean; program: GsocProgram; message?: string }> {
    return this.http.patch<{ success: boolean; program: GsocProgram; message?: string }>(
      `${this.adminUrl}/programs/${id}`,
      dto,
      this.httpOptions
    );
  }

  deleteProgram(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(
      `${this.adminUrl}/programs/${id}`,
      this.httpOptions
    );
  }

  // --- Admin Ideas Endpoints ---
  getIdeas(programId?: string): Observable<{ success: boolean; ideas: GsocIdea[] }> {
    const url = programId ? `${this.adminUrl}/ideas?programId=${programId}` : `${this.adminUrl}/ideas`;
    return this.http.get<{ success: boolean; ideas: GsocIdea[] }>(
      url,
      this.httpOptions
    );
  }

  createIdea(dto: Partial<GsocIdea> & { mentorIds?: string[] }): Observable<{ success: boolean; idea: GsocIdea; message?: string }> {
    return this.http.post<{ success: boolean; idea: GsocIdea; message?: string }>(
      `${this.adminUrl}/ideas`,
      dto,
      this.httpOptions
    );
  }

  updateIdea(id: string, dto: Partial<GsocIdea> & { mentorIds?: string[] }): Observable<{ success: boolean; idea: GsocIdea; message?: string }> {
    return this.http.patch<{ success: boolean; idea: GsocIdea; message?: string }>(
      `${this.adminUrl}/ideas/${id}`,
      dto,
      this.httpOptions
    );
  }

  deleteIdea(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(
      `${this.adminUrl}/ideas/${id}`,
      this.httpOptions
    );
  }

  reorderIdeas(orderedIds: string[]): Observable<{ success: boolean; message?: string }> {
    return this.http.patch<{ success: boolean; message?: string }>(
      `${this.adminUrl}/ideas/reorder`,
      { orderedIds },
      this.httpOptions
    );
  }

  // --- Admin Mentors Endpoints ---
  getMentors(): Observable<{ success: boolean; mentors: GsocMentor[] }> {
    return this.http.get<{ success: boolean; mentors: GsocMentor[] }>(
      `${this.adminUrl}/mentors`,
      this.httpOptions
    );
  }

  createMentor(dto: Partial<GsocMentor>): Observable<{ success: boolean; mentor: GsocMentor; message?: string }> {
    return this.http.post<{ success: boolean; mentor: GsocMentor; message?: string }>(
      `${this.adminUrl}/mentors`,
      dto,
      this.httpOptions
    );
  }

  updateMentor(id: string, dto: Partial<GsocMentor>): Observable<{ success: boolean; mentor: GsocMentor; message?: string }> {
    return this.http.patch<{ success: boolean; mentor: GsocMentor; message?: string }>(
      `${this.adminUrl}/mentors/${id}`,
      dto,
      this.httpOptions
    );
  }

  deleteMentor(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(
      `${this.adminUrl}/mentors/${id}`,
      this.httpOptions
    );
  }
}
