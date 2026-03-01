import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ProjectsCardComponent } from '../../components/projects-card/projects-card.component';
import { projectsData } from './projects-data';
import { Project } from './project.model';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { BackToTopComponent } from '../../components/back-to-top/back-to-top.component';
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
    BackToTopComponent,
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
  private allSearchResults: Project[] = []; // Store all search results for client-side pagination

  private titleService = inject(Title);
  private metaService = inject(Meta);
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
   * Routes to search or listing based on searchTerm.
   *
   * For searches: Fetches all results client-side, then handles pagination locally
   * For non-searches: Uses server-side pagination
   */
  private fetchCurrentPage(): void {
    this.isLoading = true;

    if (this.searchTerm) {
      // For search: fetch all matching results at once with high limit
      this.projectCacheService
        .searchProjects(this.searchTerm, 1, 1000) // Fetch up to 1000 results
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.allSearchResults = response.repositories;
            this.serverTotal = response.repositories.length; // Actual count of filtered results
            this.totalPages = Math.max(
              1,
              Math.ceil(this.serverTotal / this.projectsPerPage),
            );
            this.updateSearchDisplay();
            this.searchError = null;
            this.isLoading = false;
          },
          error: () => {
            this.searchError = 'Search failed. Please try again.';
            this.displayProjects = [];
            this.allSearchResults = [];
            this.serverTotal = 0;
            this.totalPages = 1;
            this.isLoading = false;
          },
        });
    } else {
      // For non-search: use server-side pagination as usual
      this.projectCacheService
        .getProjects(this.currentPage, this.projectsPerPage)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
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
            this.isLoading = false;
          },
        });
    }
  }

  /**
   * Updates display with paginated search results
   */
  private updateSearchDisplay(): void {
    const start = (this.currentPage - 1) * this.projectsPerPage;
    const end = start + this.projectsPerPage;
    this.displayProjects = this.allSearchResults.slice(start, end);
  }

  trackByProjectName(index: number, project: Project): string {
    return project.name;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      if (this.searchTerm) {
        this.updateSearchDisplay(); // Use cached search results
      } else {
        this.fetchCurrentPage(); // Fetch new server page
      }
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      if (this.searchTerm) {
        this.updateSearchDisplay(); // Use cached search results
      } else {
        this.fetchCurrentPage(); // Fetch new server page
      }
    }
  }

  goToFirstPage(): void {
    if (this.currentPage !== 1) {
      this.currentPage = 1;
      if (this.searchTerm) {
        this.updateSearchDisplay(); // Use cached search results
      } else {
        this.fetchCurrentPage(); // Fetch new server page
      }
    }
  }

  goToLastPage(): void {
    if (this.currentPage !== this.totalPages) {
      this.currentPage = this.totalPages;
      if (this.searchTerm) {
        this.updateSearchDisplay(); // Use cached search results
      } else {
        this.fetchCurrentPage(); // Fetch new server page
      }
    }
  }

  onItemsPerPageChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.projectsPerPage = parseInt(selectElement.value, 10);
    this.currentPage = 1;

    if (this.searchTerm) {
      // Recalculate total pages for search results with new items-per-page
      this.totalPages = Math.max(
        1,
        Math.ceil(this.allSearchResults.length / this.projectsPerPage),
      );
      this.updateSearchDisplay();
    } else {
      this.fetchCurrentPage();
    }
  }
}