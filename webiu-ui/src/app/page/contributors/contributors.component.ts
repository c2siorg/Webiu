// contributors.component.ts
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
    { label: '500+', min: 500, max: null }
  ];

  followerRanges: FollowerRange[] = [
    { label: '0 to 10', min: 0, max: 10 },
    { label: '10 to 50', min: 10, max: 50 },
    { label: '50 to 100', min: 50, max: 100 },
    { label: '100 to 500', min: 100, max: 500 },
    { label: '500 to 1000', min: 500, max: 1000 },
    { label: '1000+', min: 1000, max: null }
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
      this.filterProfiles();
    });
  }


  getProfiles() {
    this.http
      .get<Contributor[]>(`${environment.serverUrl}/api/contributor/contributors`)
      .subscribe({
        next: (res) => {
          this.contributors = res || [];
          this.fetchFollowerData(); 
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
      this.displayProfiles = [...this.contributors]; 
      this.isLoading = false;
    });
  }
  
  
  handleProfileResponse(profiles: Contributor[]) {
    this.profiles = profiles;
    this.commonUtil.commonProfiles = this.profiles;
    this.allRepos = this.getUniqueRepos();
    this.totalPages = Math.ceil((this.profiles.length || 0) / this.profilesPerPage);
    this.filterProfiles();
    this.isLoading = false;
  }

  getUniqueRepos(): string[] {
    return Array.from(new Set(this.profiles.flatMap((profile) => profile.repos)))
      .sort();
  }

  onRepoChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedRepo = selectElement.value;
    this.filterProfiles();
  }

  onContributionRangeChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedContributionRange = selectElement.value;
    this.filterProfiles();
  }

  onFollowerRangeChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedFollowerRange = selectElement.value;
    this.filterProfiles();
  }

  filterProfiles() {
    const searchTextValue = this.searchText.value?.toLocaleLowerCase().trim() || '';
    const filteredProfiles = this.profiles.filter((doc) =>
      this.matchesSearchText(doc, searchTextValue) &&
      this.matchesSelectedRepo(doc) &&
      this.matchesContributionRange(doc) &&
      this.matchesFollowerRange(doc)
    );

    this.totalPages = Math.ceil(filteredProfiles.length / this.profilesPerPage);
    this.displayProfiles = filteredProfiles.slice(
      (this.currentPage - 1) * this.profilesPerPage,
      this.currentPage * this.profilesPerPage
    );
  }

  matchesSearchText(doc: Contributor, searchText: string): boolean {
    return !searchText.length || doc.login.toLocaleLowerCase().includes(searchText);
  }

  matchesSelectedRepo(doc: Contributor): boolean {
    return !this.selectedRepo.length || doc.repos.includes(this.selectedRepo);
  }

  matchesContributionRange(doc: Contributor): boolean {
    if (!this.selectedContributionRange) return true;
    
    const range = this.contributionRanges.find(r => r.label === this.selectedContributionRange);
    if (!range) return true;
    
    return doc.contributions >= range.min && 
           (range.max === null || doc.contributions <= range.max);
  }

  matchesFollowerRange(doc: Contributor): boolean {
    if (!this.selectedFollowerRange) return true;
    
    const range = this.followerRanges.find(r => r.label === this.selectedFollowerRange);
    if (!range) return true;
    
    return doc.followers >= range.min && 
           (range.max === null || doc.followers <= range.max);
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
        // Show button when user scrolls down 100px from the top
        this.showButton = window.scrollY > 100;
      }

      scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
}