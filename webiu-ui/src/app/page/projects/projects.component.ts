import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ProjectsCardComponent } from '../../components/projects-card/projects-card.component';

interface Project {
  name: string;
  description: string | null;
  issue: number;
  pull_requests: number;
  link: string;
  open_issues_count: number;
  html_url: string;
  language: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    NavbarComponent,
    ProjectsCardComponent,
  ],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  projectsData: Project[] = [];
  isLoading = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchProjects();
  }

  fetchProjects(): void {
    this.http
      .get<{ repositories: Project[] }>(
        'http://localhost:5000/api/v1/project/projects/'
      )
      .subscribe({
        next: (response) => {
          this.projectsData = response.repositories;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching projects:', error);
          this.isLoading = false;
        },
        complete: () => {
          console.log('Fetch projects request completed.');
        },
      });
  }

  trackByProjectName(index: number, project: Project): string {
    return project.name;
  }
}
