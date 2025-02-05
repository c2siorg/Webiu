import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ProjectsCardComponent } from '../../components/projects-card/projects-card.component';
import { projectsData } from './projects-data';
import { Project, ProjectResponse } from './project.model';
import { environment } from '../../../environments/environment'; 

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    NavbarComponent,
    ProjectsCardComponent,
  ],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  projectsData: Project[] = [];
  filteredProjects: Project[] = [];
  isLoading = true;
  searchQuery = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchProjects();
  }

  fetchProjects(): void {
    this.http
      .get<ProjectResponse>(`${environment.serverUrl}api/v1/project/projects/`)
      .subscribe({
        next: (response) => {
          this.projectsData = response.repositories;
          this.filteredProjects = response.repositories; 
          this.isLoading = false;
        },
        error: (error) => {
          this.projectsData = projectsData.repositories;
          this.filteredProjects = projectsData.repositories; 
          this.isLoading = false;
        },
        complete: () => {
          console.log('Fetch projects request completed.');
        },
      });
  }

  
  filterProjectsByName(): void {
    if (this.searchQuery) {
      this.filteredProjects = this.projectsData.filter((project) =>
        project.name.toLowerCase().includes(this.searchQuery.toLowerCase()) 
      );
    } else {
      this.filteredProjects = this.projectsData; 
    }
  }

  trackByProjectName(index: number, project: Project): string {
    return project.name;
  }
}
