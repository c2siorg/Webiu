import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ProjectsCardComponent } from '../../components/projects-card/projects-card.component';
import { projectsData } from './projects-data';
import { Project, ProjectResponse } from './project.model';
import { FormsModule } from '@angular/forms';

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
  searchTerm: string = '';
  isLoading = true;
  org = 'c2siorg';
  showButton = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchProjects();
  }

  fetchProjects(): void {
    this.http
      .get<ProjectResponse>(`http://localhost:5000/api/projects/projects`)
      .subscribe({
        next: (response) => {
          this.projectsData = this.sortProjects(response.repositories);
          this.filteredProjects = [...this.projectsData];
          this.isLoading = false;
        },
        error: (error) => {
          this.projectsData = this.sortProjects(projectsData.repositories);
          this.filteredProjects = [...this.projectsData];
          this.isLoading = false;
        },
        complete: () => {
          console.log('Fetch projects request completed.');
        },
      });
  }

  sortProjects(projects: Project[]): Project[] {
    return projects.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
  }

  trackByProjectName(index: number, project: Project): string {
    return project.name;
  }

  filterProjects(): void {
    const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
    this.filteredProjects = this.sortProjects(
      this.projectsData.filter((project) =>
        project.name.toLowerCase().includes(lowerCaseSearchTerm)
      )
    );
    if (this.filteredProjects.length === 0) {
      this.filteredProjects = [];
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.showButton = window.scrollY > 100;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
