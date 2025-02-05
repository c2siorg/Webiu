import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
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
    NavbarComponent,
    ProjectsCardComponent,
  ],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  projectsData: Project[] = [];
  isLoading = true;
  @ViewChild('scrollTopButton') scrollTopButton!: ElementRef; // Reference to button


  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchProjects();
    window.addEventListener('scroll', this.onWindowScroll);
  }

  fetchProjects(): void {
    this.http
      .get<ProjectResponse>(`${environment.serverUrl}api/v1/project/projects/`)
      .subscribe({
        next: (response) => {
          this.projectsData = response.repositories;
          this.isLoading = false;
        },
        error: (error) => {
          this.projectsData = projectsData.repositories;
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

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onWindowScroll);
  }

  onWindowScroll = (): void => {
    if (this.scrollTopButton) {
      this.scrollTopButton.nativeElement.style.display = window.scrollY > 850 ? 'block' : 'none';
    }
  };

  GoToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
