import { Component, OnInit, HostListener, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Contributor } from '../../common/data/contributor';

import { ProfileCardComponent } from '../../components/profile-card/profile-card.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CommmonUtilService } from '../../common/service/commmon-util.service';
import { environment } from '../../../environments/environment';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { BackToTopComponent } from '../../components/back-to-top/back-to-top.component';

interface ContributionRange {
  label: string;
  min: number;
  max: number | null;
}

@Component({
  selector: 'app-contributors',
  standalone: true,
  imports: [
    NavbarComponent,
    HttpClientModule,
    ReactiveFormsModule,
    ProfileCardComponent,
    LoadingSpinnerComponent,
    BackToTopComponent,
  ],
  templateUrl: './contributors.component.html',
  styleUrls: ['./contributors.component.scss'],
})
export class ContributorsComponent implements OnInit {
  profiles: Contributor[] = [];
  displayProfiles: Contributor[] = [];
  searchText = new FormControl('');
  selectedRepo = '';
  selectedContributionRange = '';

  selectedSort = '';
  allRepos: string[] = [];
  isLoading = true;
  showButton = false;
  private platformId = inject(PLATFORM_ID);
  contributors: Contributor[] = [];

  contributionRanges: ContributionRange[] = [
    { label: '0 to 5', min: 0, max: 5 },
    { label: '5 to 10', min: 5, max: 10 },
    { label: '10 to 50', min: 10, max: 50 },
    { label: '50 to 100', min: 50, max: 100 },
    { label: '100 to 500', min: 100, max: 500 },
    { label: '500+', min: 500, max: null },
  ];

  currentPage = 1;
  profilesPerPage = 9;
  totalPages = 1;

  private http = inject(HttpClient);
  private commonUtil = inject(CommmonUtilService);
  private router = inject(Router);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  ngOnInit() {
    this.titleService.setTitle('Contributors | Webiu 2.0');
    this.metaService.updateTag({ name: 'description', content: 'Meet the contributors powering C2SI and SCoRe Lab projects.' });
    this.metaService.updateTag({ property: 'og:title', content: 'Contributors | Webiu 2.0' });
    this.metaService.updateTag({ property: 'og:description', content: 'Meet the contributors powering C2SI and SCoRe Lab projects.' });

    this.getProfiles();
    this.searchText.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.filterProfiles();
    });
  }

  getProfiles() {
    this.http
      .get<
        Contributor[]
      >(`${environment.serverUrl}/api/contributor/contributors`)
      .subscribe({
        next: (res) => {
          this.contributors = res || [];
          this.fetchFollowerData();
          console.log('fetched contributors');
        },
        error: () => {
          console.error('Error fetching contributors');
          this.handleProfileResponse([]);
        },
      });
  }

  fetchFollowerData() {
    if (!this.contributors || this.contributors.length === 0) {
      this.isLoading = false;
      return;
    }

    const usernames = this.contributors.map((c) => c.login);

    this.http
      .post<
        Record<string, { followers: number; following: number }>
      >(`${environment.serverUrl}/api/user/batch-social`, { usernames })
      .subscribe({
        next: (data) => {
          this.contributors.forEach((contributor) => {
            const social = data[contributor.login];
            contributor.followers = social?.followers ?? 0;
            contributor.following = social?.following ?? 0;
          });
          this.profiles = [...this.contributors];
          this.handleProfileResponse(this.profiles);
          this.isLoading = false;
        },
        error: () => {
          this.profiles = [...this.contributors];
          this.handleProfileResponse(this.profiles);
          this.isLoading = false;
        },
      });
  }

  handleProfileResponse(profiles: Contributor[]) {
    this.profiles = profiles;
    this.commonUtil.commonProfiles = this.profiles;
    this.allRepos = this.getUniqueRepos();
    this.totalPages = Math.ceil(
      (this.profiles.length || 0) / this.profilesPerPage,
    );
    this.filterProfiles();
    this.isLoading = false;
  }

  getUniqueRepos(): string[] {
    const allRepos = new Set<string>();
    this.profiles.forEach((profile) => {
      if (profile.repos) {
        profile.repos.forEach((repo) => allRepos.add(repo));
      }
    });
    return Array.from(allRepos).sort();
  }

  onRepoChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedRepo = selectElement.value;
    this.currentPage = 1;
    this.filterProfiles();
  }

  onContributionRangeChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedContributionRange = selectElement.value;
    this.currentPage = 1;
    this.filterProfiles();
  }

  clearSearch() {
    this.searchText.setValue('');
    this.filterProfiles();
  }

  filterProfiles() {
    const searchTextValue = this.searchText.value?.toLowerCase().trim() || '';

    let filteredProfiles = [...this.profiles];

    if (searchTextValue) {
      filteredProfiles = filteredProfiles.filter((profile) =>
        profile.login.toLowerCase().includes(searchTextValue),
      );
    }

    if (this.selectedRepo) {
      filteredProfiles = filteredProfiles.filter((profile) =>
        profile.repos?.includes(this.selectedRepo),
      );
    }

    if (this.selectedContributionRange) {
      const range = this.contributionRanges.find(
        (r) => r.label === this.selectedContributionRange,
      );
      if (range) {
        filteredProfiles = filteredProfiles.filter(
          (profile) =>
            profile.contributions >= range.min &&
            (range.max === null || profile.contributions <= range.max),
        );
      }
    }

    // Apply sorting
    if (this.selectedSort) {
      filteredProfiles = this.sortProfiles(filteredProfiles, this.selectedSort);
    }

    this.totalPages = Math.ceil(filteredProfiles.length / this.profilesPerPage);

    const startIndex = (this.currentPage - 1) * this.profilesPerPage;
    this.displayProfiles = filteredProfiles.slice(
      startIndex,
      startIndex + this.profilesPerPage,
    );
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.filterProfiles();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.filterProfiles();
    }
  }

  goToFirstPage() {
    this.currentPage = 1;
    this.filterProfiles();
  }

  goToLastPage() {
    this.currentPage = this.totalPages;
    this.filterProfiles();
  }

  onItemsPerPageChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.profilesPerPage = parseInt(selectElement.value, 10);
    this.currentPage = 1; // Reset to first page
    this.filterProfiles();
  }

  onSortChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedSort = selectElement.value;
    this.currentPage = 1;
    this.filterProfiles();
  }

  sortProfiles(profiles: Contributor[], sortBy: string): Contributor[] {
    const sorted = [...profiles];

    switch (sortBy) {
      case 'name-asc':
        return sorted.sort((a, b) =>
          a.login.toLowerCase().localeCompare(b.login.toLowerCase()),
        );
      case 'name-desc':
        return sorted.sort((a, b) =>
          b.login.toLowerCase().localeCompare(a.login.toLowerCase()),
        );
      case 'contributions-desc':
        return sorted.sort((a, b) => b.contributions - a.contributions);
      case 'contributions-asc':
        return sorted.sort((a, b) => a.contributions - b.contributions);
      default:
        return sorted;
    }
  }

  onUsernameClick(username: string) {
    this.router.navigate(['/search'], {
      queryParams: { username: username },
    });
  }

  trackByFn(_: number, profile: Contributor): string {
    return profile.login;
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
