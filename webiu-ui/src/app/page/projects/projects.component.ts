import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ProjectsCardComponent } from '../../components/projects-card/projects-card.component';
import { projectsData } from './projects-data';
import { Project, ProjectResponse } from './project.model';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule, // Include FormsModule here
    NavbarComponent,
    ProjectsCardComponent,
  ],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  projectsData: Project[] = [];
  filteredProjects: Project[] = [];
  searchTerm: string = '';
  isLoading = true;
  org = 'c2siorg';
  
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchProjects();
  }

  fetchProjects(): void {
    this.http
      .get<ProjectResponse>(`http://localhost:5000/api/projects/projects`)
      .subscribe({
        next: (response) => {
          this.projectsData = response.repositories;
          this.filteredProjects = [...this.projectsData]; // Initialize filteredProjects
          this.isLoading = false;
        },
        error: (error) => {
          this.projectsData = projectsData.repositories;
          this.filteredProjects = [...this.projectsData];
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

  filterProjects(): void {
    const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
    this.filteredProjects = this.projectsData.filter((project) =>
      project.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }
}
