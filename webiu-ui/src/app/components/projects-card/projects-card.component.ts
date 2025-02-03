import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-projects-card',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './projects-card.component.html',
  styleUrls: ['./projects-card.component.scss'],
})
export class ProjectsCardComponent {
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

  issueCount: number = 0;
  pullRequestCount: number = 0; 
  initialized: boolean = false; 

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (!this.initialized) {
      this.fetchIssuesAndPRs();
    }
  }

  fetchIssuesAndPRs(): void {
    const apiUrl = `http://localhost:5001/api/issues/issuesAndPr?org=${this.org}&repo=${this.repo}`;
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


  public detailsVisible: boolean = false;

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
    const languageColors: { [key: string]: string } = {
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
