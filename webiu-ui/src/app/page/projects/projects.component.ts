
import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ProjectsCardComponent } from '../../components/projects-card/projects-card.component';
import { projectsData } from './projects-data';
import { Project } from './project.model';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ProjectCacheService } from 'src/app/services/project-cache.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    HttpClientModule,
    FormsModule,
    NavbarComponent,
    ProjectsCardComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  displayProjects: Project[] = [];
  searchTerm = '';
  isLoading = true;
  org = 'c2siorg';
  currentPage = 1;
  projectsPerPage = 9;
  totalPages = 1;
  serverTotal = 0;
  searchError: string | null = null;

  private titleService = inject(Title);
  private metaService = inject(Meta);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);
  private projectCacheService = inject(ProjectCacheService);


  ngOnInit(): void {
    this.titleService.setTitle('Projects | Webiu 2.0');
    this.metaService.updateTag({
      name: 'description',
      content: 'Explore the open-source projects hosted by C2SI and SCoRe Lab.',
    });
    this.metaService.updateTag({
      property: 'og:title',
      content: 'Projects | Webiu 2.0',
    });
    this.metaService.updateTag({
      property: 'og:description',
      content: 'Explore the open-source projects hosted by C2SI and SCoRe Lab.',
    });

    this.fetchCurrentPage();

  }

 fix/github-n-plus-1
  onSearchInput(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  performSearch(searchTerm: string): void {
  this.currentPage = 1;

  if (!searchTerm) {
    this.fetchProjects();
    return;
  }

  this.isLoading = true;

  this.projectCacheService.searchProjects(searchTerm)
    .subscribe({
      next: (response) => {
        this.serverTotal = response.total;
        this.projectsData = this.sortProjects(response.repositories);
        this.filteredProjects = [...this.projectsData];

        
        this.totalPages = Math.max(
          1,
          Math.ceil(this.filteredProjects.length / this.projectsPerPage),
        );

        this.updateDisplayProjects();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
}

  fetchProjects(): void {
    this.isLoading = true;
    this.projectCacheService
      .getProjects(this.currentPage, this.projectsPerPage)
      .subscribe({
        next: (response) => {
          this.serverTotal = response.total;
          this.projectsData = this.sortProjects(response.repositories);
          this.filteredProjects = this.searchTerm
            ? this.sortProjects(
                this.projectsData.filter((p) =>
                  p.name.toLowerCase().includes(this.searchTerm.toLowerCase()),
                ),
              )
            : [...this.projectsData];
          this.updateDisplayProjects();
          this.isLoading = false;
        },
        error: () => {
          this.serverTotal = projectsData.total;
          this.projectsData = this.sortProjects(projectsData.repositories);
          this.filteredProjects = [...this.projectsData];
          this.updateDisplayProjects();
          this.isLoading = false;
        },
      });
  }

  sortProjects(projects: Project[]): Project[] {
    return projects.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );

  onSearch(term?: string): void {
    if (term !== undefined) {
      this.searchTerm = term;
    }
    this.currentPage = 1;
    this.searchError = null;
    this.fetchCurrentPage();
  }

  /**
   * Single entry point for all data fetching.
   * Routes to search or listing based on searchTerm, always server-paginated.
   */
  private fetchCurrentPage(): void {
    this.isLoading = true;

    const request$ = this.searchTerm
      ? this.projectCacheService.searchProjects(
        this.searchTerm,
        this.currentPage,
        this.projectsPerPage,
      )
      : this.projectCacheService.getProjects(
        this.currentPage,
        this.projectsPerPage,
      );

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.serverTotal = response.total;
        this.displayProjects = response.repositories;
        this.totalPages = Math.max(
          1,
          Math.ceil(this.serverTotal / this.projectsPerPage),
        );
        this.searchError = null;
        this.isLoading = false;
      },
      error: () => {
        if (!this.searchTerm) {
          this.serverTotal = projectsData.total;
          const start = (this.currentPage - 1) * this.projectsPerPage;
          this.displayProjects = projectsData.repositories.slice(
            start,
            start + this.projectsPerPage,
          );
          this.totalPages = Math.max(
            1,
            Math.ceil(this.serverTotal / this.projectsPerPage),
          );
        } else {
          // Global error interceptor will handle the notification
          this.displayProjects = [];
          this.serverTotal = 0;
          this.totalPages = 1;
        }
        this.isLoading = false;
      },
    });
 webiu-2026-pre-gsoc
  }

  trackByProjectName(index: number, project: Project): string {
    return project.name;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.fetchCurrentPage();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchCurrentPage();
    }
  }

  goToFirstPage(): void {
    if (this.currentPage !== 1) {
      this.currentPage = 1;
      this.fetchCurrentPage();
    }
  }

  goToLastPage(): void {
    if (this.currentPage !== this.totalPages) {
      this.currentPage = this.totalPages;
      this.fetchCurrentPage();
    }
  }

  onItemsPerPageChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.projectsPerPage = parseInt(selectElement.value, 10);
    this.currentPage = 1;
    this.fetchCurrentPage();
  }
 fix/github-n-plus-1
}

}
 webiu-2026-pre-gsoc
