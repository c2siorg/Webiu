import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Contributor, contributors } from '../../common/data/contributor';
import { CommonModule } from '@angular/common';
import { ProfileCardComponent } from '../../components/profile-card/profile-card.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CommmonUtilService } from '../../common/service/commmon-util.service';
import { environment } from '../../../environments/environment';

interface ContributionRange {
  label: string;
  min: number;
  max: number | null;
}

interface FollowerRange {
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
    CommonModule,
    ProfileCardComponent,
  ],
  templateUrl: './contributors.component.html',
  styleUrls: ['./contributors.component.scss'],
})
export class ContributorsComponent implements OnInit {
  profiles: Contributor[] = [];
  displayProfiles: Contributor[] = [];
  searchText = new FormControl('');
  selectedRepo: string = '';
  selectedContributionRange: string = '';
  selectedFollowerRange: string = '';
  allRepos: string[] = [];
  isLoading = true;
  showButton = false;
  contributors: Contributor[] = contributors;

  contributionRanges: ContributionRange[] = [
    { label: '0 to 5', min: 0, max: 5 },
    { label: '5 to 10', min: 5, max: 10 },
    { label: '10 to 50', min: 10, max: 50 },
    { label: '50 to 100', min: 50, max: 100 },
    { label: '100 to 500', min: 100, max: 500 },
    { label: '500+', min: 500, max: null },
  ];

  followerRanges: FollowerRange[] = [
    { label: '0 to 10', min: 0, max: 10 },
    { label: '10 to 50', min: 10, max: 50 },
    { label: '50 to 100', min: 50, max: 100 },
    { label: '100 to 500', min: 100, max: 500 },
    { label: '500 to 1000', min: 500, max: 1000 },
    { label: '1000+', min: 1000, max: null },
  ];

  currentPage = 1;
  profilesPerPage = 9;
  totalPages = 1;

  constructor(
    private http: HttpClient,
    private commonUtil: CommmonUtilService,
    private router: Router
  ) {}

  ngOnInit() {
    this.getProfiles();
    this.searchText.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.filterProfiles();
    });
  }

  getProfiles() {
    this.http
      .get<Contributor[]>(
        `${environment.serverUrl}/api/contributor/contributors`
      )
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

    let requests = this.contributors.map((contributor) =>
      this.http
        .get<{ followers?: number; following?: number }>(
          `${environment.serverUrl}/api/user/followersAndFollowing/${contributor.login}`
        )
        .toPromise()
        .then((data) => {
          contributor.followers = data?.followers ?? 0;
          contributor.following = data?.following ?? 0;
        })
        .catch(() => {
          contributor.followers = 0;
          contributor.following = 0;
        })
    );

    Promise.all(requests).then(() => {
      this.profiles = [...this.contributors];
      this.handleProfileResponse(this.profiles);
      this.isLoading = false;
    });
  }

  handleProfileResponse(profiles: Contributor[]) {
    this.profiles = profiles;
    this.commonUtil.commonProfiles = this.profiles;
    this.allRepos = this.getUniqueRepos();
    this.totalPages = Math.ceil(
      (this.profiles.length || 0) / this.profilesPerPage
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

  onFollowerRangeChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedFollowerRange = selectElement.value;
    this.currentPage = 1;
    this.filterProfiles();
  }

  filterProfiles() {
    const searchTextValue = this.searchText.value?.toLowerCase().trim() || '';

    let filteredProfiles = [...this.profiles];

    if (searchTextValue) {
      filteredProfiles = filteredProfiles.filter((profile) =>
        profile.login.toLowerCase().includes(searchTextValue)
      );
    }

    if (this.selectedRepo) {
      filteredProfiles = filteredProfiles.filter((profile) =>
        profile.repos?.includes(this.selectedRepo)
      );
    }

    if (this.selectedContributionRange) {
      const range = this.contributionRanges.find(
        (r) => r.label === this.selectedContributionRange
      );
      if (range) {
        filteredProfiles = filteredProfiles.filter(
          (profile) =>
            profile.contributions >= range.min &&
            (range.max === null || profile.contributions <= range.max)
        );
      }
    }

    if (this.selectedFollowerRange) {
      const range = this.followerRanges.find(
        (r) => r.label === this.selectedFollowerRange
      );
      if (range) {
        filteredProfiles = filteredProfiles.filter(
          (profile) =>
            profile.followers >= range.min &&
            (range.max === null || profile.followers <= range.max)
        );
      }
    }

    this.totalPages = Math.ceil(filteredProfiles.length / this.profilesPerPage);

    const startIndex = (this.currentPage - 1) * this.profilesPerPage;
    this.displayProfiles = filteredProfiles.slice(
      startIndex,
      startIndex + this.profilesPerPage
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
    this.showButton = window.scrollY > 100;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
