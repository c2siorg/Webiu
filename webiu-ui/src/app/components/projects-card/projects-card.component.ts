import { Component, Input, OnInit, inject } from '@angular/core';

import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-projects-card',
  standalone: true,
  imports: [HttpClientModule, CommonModule],
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

  issueCount = 0;
  pullRequestCount = 0;
  initialized = false;

  private http = inject(HttpClient);


  ngOnInit(): void {
    if (!this.initialized) {
      this.fetchIssuesAndPRs();
    }
  }

  fetchIssuesAndPRs(): void {
    const apiUrl = `${environment.serverUrl}/api/issues/issuesAndPr?org=${this.org}&repo=${this.repo}`;
    this.http.get<{ issues: number; pullRequests: number }>(apiUrl).subscribe(
      (data) => {
        this.issueCount = data.issues;
        this.pullRequestCount = data.pullRequests;
        this.initialized = true;
      },
      (error) => {
        console.error('Failed to fetch issues and PRs:', error);
      }
    );
  }

  public detailsVisible = false;

  toggleDetails() {
    this.detailsVisible = !this.detailsVisible;
  }

  get truncatedDescription(): string {
    if (!this.description) {
      return '';
    }
    return this.description.length > 100
      ? `${this.description.slice(0, 100)}...`
      : this.description;
  }

  getLanguageColor(): string {
    const languageColors: Record<string, string> = {
      Python: '#3572A5',
      JavaScript: '#F1E05A',
      TypeScript: '#2B7489',
      Java: '#B07219',
      HTML: '#E34C26',
      'C++': '#F34B7D',
      HCL: '#0298C3',
      Default: '#607466',
    };

    return languageColors[this.language] || languageColors['Default'];
  }
}
