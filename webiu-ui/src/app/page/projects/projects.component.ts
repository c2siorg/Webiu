import { Component, OnInit, HostListener, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ProjectsCardComponent } from '../../components/projects-card/projects-card.component';
import { projectsData } from './projects-data';
import { Project } from './project.model';
import { FormsModule } from '@angular/forms';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader/skeleton-loader.component';
import { ProjectCacheService } from 'src/app/services/project-cache.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    HttpClientModule,
    FormsModule,
    NavbarComponent,
    ProjectsCardComponent,
    SkeletonLoaderComponent,
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
  showButton = false;
  currentPage = 1;
  projectsPerPage = 9;
  totalPages = 1;
  private platformId = inject(PLATFORM_ID);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  private projectCacheService = inject(ProjectCacheService);
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.titleService.setTitle('Projects | Webiu 2.0');
    this.metaService.updateTag({ name: 'description', content: 'Explore the open-source projects hosted by C2SI and SCoRe Lab.' });
    this.metaService.updateTag({ property: 'og:title', content: 'Projects | Webiu 2.0' });
    this.metaService.updateTag({ property: 'og:description', content: 'Explore the open-source projects hosted by C2SI and SCoRe Lab.' });

    this.fetchProjects();
    this.setupSearchDebounce();
  }

  setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  onSearchInput(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.searchSubject.next(searchTerm);
  }

  performSearch(searchTerm: string): void {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    this.filteredProjects = this.sortProjects(
      this.projectsData.filter((project) =>
        project.name.toLowerCase().includes(lowerCaseSearchTerm),
      ),
    );
    this.currentPage = 1;
    this.updateDisplayProjects();
  }

  fetchProjects(): void {
    this.projectCacheService.getProjects().subscribe({
      next: (response) => {
        this.projectsData = this.sortProjects(response.repositories);
        this.filteredProjects = [...this.projectsData];
        this.updateDisplayProjects();
        this.isLoading = false;
      },
      error: () => {
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
    // This method is now called by performSearch after debounce
    this.onSearchInput(this.searchTerm);
  }

  updateDisplayProjects(): void {
    this.totalPages = Math.max(
      1,
      Math.ceil(this.filteredProjects.length / this.projectsPerPage),
    );
    const startIndex = (this.currentPage - 1) * this.projectsPerPage;
    this.displayProjects = this.filteredProjects.slice(
      startIndex,
      startIndex + this.projectsPerPage,
    );
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayProjects();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayProjects();
    }
  }

  goToFirstPage(): void {
    this.currentPage = 1;
    this.updateDisplayProjects();
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages;
    this.updateDisplayProjects();
  }

  onItemsPerPageChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.projectsPerPage = parseInt(selectElement.value, 10);
    this.currentPage = 1;
    this.updateDisplayProjects();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.showButton = window.scrollY > 100;
    }
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
