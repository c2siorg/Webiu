import { Component, Input, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { LANGUAGE_COLORS, DEFAULT_LANGUAGE_COLOR } from '../../common/utils/language-colors';

@Component({
  selector: 'app-projects-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './projects-card.component.html',
  styleUrls: ['./projects-card.component.scss'],
})
export class ProjectsCardComponent implements OnInit {
  @Input() name!: string;
  @Input() description: string | null = '';
  @Input() issue!: number;
  @Input() pullRequests!: number;
  @Input() link!: string;
  @Input() language!: string;
  @Input() topics: string[] = [];
  @Input() createdAt!: string;
  @Input() updatedAt!: string;
  @Input() org!: string;
  @Input() repo!: string;
  @Input() stars = 0;
  @Input() forks = 0;
  @Input() size = 0;
  @Input() license = '';

  issueCount = 0;
  pullRequestCount = 0;
  initialized = false;
  languages: string[] = [];
  techStackLoaded = false;

  private http = inject(HttpClient);

  ngOnInit(): void {
    if (!this.initialized) {
      this.fetchIssuesAndPRs();
      this.fetchTechStack();
    }
  }

  fetchIssuesAndPRs(): void {
    const apiUrl = `${environment.serverUrl}/api/v1/issues/issuesAndPr?org=${this.org}&repo=${this.repo}`;
    this.http
      .get<{ issues: number; pullRequests: number }>(apiUrl)
      .subscribe({
        next: (data) => {
          this.issueCount = data.issues;
          this.pullRequestCount = data.pullRequests;
          this.initialized = true;
        },
        error: (error) => {
          console.error(`Error fetching issues and PRs for ${this.repo}: `, error);
          this.initialized = true;
        },
      });
  }

  fetchTechStack(): void {
    const apiUrl = `${environment.serverUrl}/api/v1/projects/tech-stack/${this.repo}`;
    this.http.get<{ languages: string[] }>(apiUrl).subscribe({
      next: (data) => {
        this.languages = data.languages ?? [];
        this.techStackLoaded = true;
      },
      error: (error) => {
        console.error('Failed to fetch tech stack:', error);
      },
    });
  }

  public detailsVisible = false;

  toggleDetails() {
    this.detailsVisible = !this.detailsVisible;
    if (this.detailsVisible && !this.techStackLoaded) {
      this.fetchTechStack();
    }
  }

  get truncatedDescription(): string {
    if (!this.description) {
      return '';
    }
    return this.description.length > 100
      ? `${this.description.slice(0, 100)}...`
      : this.description;
  }

  getLanguageColor(lang?: string): string {
    return LANGUAGE_COLORS[lang ?? this.language] ?? DEFAULT_LANGUAGE_COLOR;
  }

  getFormattedSize(): string {
    if (this.size === 0) return '0 KB';
    if (this.size < 1024) {
      return `${this.size} KB`;
    }
    return `${(this.size / 1024).toFixed(1)} MB`;
  }
}
