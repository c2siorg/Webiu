import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Apollo, gql } from 'apollo-angular';

interface Project {
  id: string;
  name: string;
  description: string;
  html_url: string;
  language: string;
  stars: number;
  forks: number;
  pull_requests: number;
}

interface GetProjectsResponse {
  projects: {
    repositories: Project[];
    total: number;
    page: number;
    limit: number;
  };
}

@Component({
  selector: 'app-graphql-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="graphql-test">
      <h2>GraphQL Test Page</h2>
      <button (click)="fetchProjects()">Fetch Projects via GraphQL</button>
      
      @if (loading) {
        <div>Loading...</div>
      }
      
      @if (error) {
        <div class="error">{{ error }}</div>
      }
      
      @if (projects.length > 0) {
        <div class="projects-list">
          <h3>Projects from GraphQL:</h3>
          @for (project of projects; track project.id) {
            <div class="project-card">
              <h4>{{ project.name }}</h4>
              <p>{{ project.description }}</p>
              <p>Stars: {{ project.stars }} | Forks: {{ project.forks }}</p>
              <a [href]="project.html_url" target="_blank">View on GitHub</a>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .graphql-test { padding: 20px; }
    .project-card { 
      border: 1px solid #ccc; 
      padding: 10px; 
      margin: 10px 0; 
      border-radius: 5px;
    }
    .error { color: red; }
    button { 
      padding: 10px 20px; 
      background: #007bff; 
      color: white; 
      border: none; 
      cursor: pointer;
    }
  `]
})
export class GraphqlTestComponent implements OnInit {
  projects: Project[] = [];
  loading = false;
  error = '';

  private apollo = inject(Apollo);

  private GET_PROJECTS = gql`
    query GetProjects {
      projects(page: 1, limit: 5) {
        repositories {
          id
          name
          description
          html_url
          language
          stars
          forks
          pull_requests
        }
        total
      }
    }
  `;

  ngOnInit(): void {
    this.fetchProjects();
  }

  fetchProjects(): void {
    this.loading = true;
    this.error = '';

    this.apollo
      .watchQuery<GetProjectsResponse>({
        query: this.GET_PROJECTS,
        pollInterval: 0,
      })
      .valueChanges.subscribe({
        next: (result) => {
          this.projects = result.data?.projects?.repositories || [];
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to fetch projects. Make sure the GraphQL server is running on port 5050.';
          this.loading = false;
          console.error('GraphQL error:', err);
        },
      });
  }
}
