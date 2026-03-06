import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
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
  projectsData: Project[] = [];
  filteredProjects: Project[] = [];
  displayProjects: Project[] = [];
  searchTerm = '';
  isLoading = true;
  org = 'c2siorg';
  currentPage = 1;
  projectsPerPage = 9;
  totalPages = 1;
  serverTotal = 0;
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private destroyRef = inject(DestroyRef);

  private projectCacheService = inject(ProjectCacheService);
  private searchSubject = new Subject<string>();

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

    this.fetchProjects();
    this.setupSearchDebounce();
  }

  setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((searchTerm) => {
        this.performSearch(searchTerm);
      });
  }

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
  }

  trackByProjectName(index: number, project: Project): string {
    return project.name;
  }

  filterProjects(): void {
    // Delegates to debounced search handler
    this.onSearchInput(this.searchTerm);
  }

  updateDisplayProjects(): void {
    if (this.searchTerm) {
      // Local pagination over filtered results on the current server page
      this.totalPages = Math.max(
        1,
        Math.ceil(this.filteredProjects.length / this.projectsPerPage),
      );
      const startIndex = (this.currentPage - 1) * this.projectsPerPage;
      this.displayProjects = this.filteredProjects.slice(
        startIndex,
        startIndex + this.projectsPerPage,
      );
    } else {
      // Server already paginated; use total from API for page count
      this.totalPages = Math.max(
        1,
        Math.ceil(this.serverTotal / this.projectsPerPage),
      );
      this.displayProjects = [...this.filteredProjects];
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      if (this.searchTerm) {
        this.updateDisplayProjects();
      } else {
        this.fetchProjects();
      }
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      if (this.searchTerm) {
        this.updateDisplayProjects();
      } else {
        this.fetchProjects();
      }
    }
  }

  goToFirstPage(): void {
    this.currentPage = 1;
    if (this.searchTerm) {
      this.updateDisplayProjects();
    } else {
      this.fetchProjects();
    }
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages;
    if (this.searchTerm) {
      this.updateDisplayProjects();
    } else {
      this.fetchProjects();
    }
  }

  onItemsPerPageChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.projectsPerPage = parseInt(selectElement.value, 10);
    this.currentPage = 1;
    this.updateDisplayProjects();
  }
}
