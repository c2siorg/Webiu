import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { formatDistanceToNow } from 'date-fns';
import { environment } from '../../../environments/environment';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-contributor-search',
  standalone: true,
  imports: [FormsModule, CommonModule, LoadingSpinnerComponent, HttpClientModule],
  templateUrl: './contributor-search.component.html',
  styleUrls: ['./contributor-search.component.scss'],
})
export class ContributorSearchComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  username = '';
  issues: any[] = [];
  pullRequests: any[] = [];
  uniqueRepositories: string[] = [];
  filteredIssues: any[] = [];
  filteredPullRequests: any[] = [];
  errorMessage = '';
  loading = false;
  activeView: 'issues' | 'pullRequests' = 'issues';
  selectedStatus = '';
  selectedSort = 'updated-desc';
  selectedRepo = '';
  userProfile: {
    login: string;
    avatar_url: string;
    html_url: string;
    name: string | null;
    bio: string | null;
    location: string | null;
    followers: number;
    following: number;
    created_at: string;
  } | null = null;
  private apiUrl = `${environment.serverUrl}/api/contributor`;
  private userUrl = `${environment.serverUrl}/api/user`;

  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['username']) {
        this.username = params['username'];
        this.onSearch();
      }
    });
  }

  async onSearch() {
    if (!this.username) {
      this.errorMessage = 'Please enter a username';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.userProfile = null;

    try {
      // Fetch stats (issues + PRs) and user profile in parallel
      const [statsResponse, userProfileResponse] = await Promise.all([
        firstValueFrom(this.http.get<any>(`${this.apiUrl}/stats/${this.username}`)),
        firstValueFrom(this.http.get<any>(`${this.userUrl}/profile/${this.username}`)),
      ]);

      this.issues = statsResponse.issues;
      this.pullRequests = statsResponse.pullRequests;

      this.userProfile = {
        login: userProfileResponse.login,
        avatar_url: userProfileResponse.avatar_url,
        html_url: userProfileResponse.html_url,
        name: userProfileResponse.name,
        bio: userProfileResponse.bio,
        location: userProfileResponse.location,
        followers: userProfileResponse.followers || 0,
        following: userProfileResponse.following || 0,
        created_at: userProfileResponse.created_at,
      };

      this.extractRepositories();
      this.filteredIssues = [...this.issues];
      this.filteredPullRequests = [...this.pullRequests];
    } catch {
      this.errorMessage =
        'Failed to fetch data. Please check the username or try again later.';
    } finally {
      this.loading = false;
    }
  }

  extractRepositories() {
    const allRepos = [
      ...new Set([
        ...this.issues.map((issue) => issue.repository_url.split('/').pop()),
        ...this.pullRequests.map((pr) => pr.repository_url.split('/').pop()),
      ]),
    ];
    this.uniqueRepositories = allRepos;
  }

  onRepoFilterChange(event: Event) {
    this.selectedRepo = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  onStatusFilterChange(event: Event) {
    this.selectedStatus = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  onSortChange(event: Event) {
    this.selectedSort = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  applyFilters() {
    // Filter by repository
    let filteredIssues = this.selectedRepo
      ? this.issues.filter((issue) => issue.repository_url.split('/').pop() === this.selectedRepo)
      : [...this.issues];

    let filteredPRs = this.selectedRepo
      ? this.pullRequests.filter((pr) => pr.repository_url.split('/').pop() === this.selectedRepo)
      : [...this.pullRequests];

    // Filter by status
    if (this.selectedStatus === 'open') {
      filteredIssues = filteredIssues.filter((issue) => !issue.closed_at);
      filteredPRs = filteredPRs.filter((pr) => !pr.closed_at);
    } else if (this.selectedStatus === 'closed') {
      filteredIssues = filteredIssues.filter((issue) => issue.closed_at);
      filteredPRs = filteredPRs.filter((pr) => pr.closed_at && !pr.merged_at);
    } else if (this.selectedStatus === 'merged') {
      filteredIssues = []; // Issues cannot be merged
      filteredPRs = filteredPRs.filter((pr) => pr.merged_at);
    } else if (this.selectedStatus === 'draft') {
      filteredIssues = []; // Issues cannot be drafts (usually)
      filteredPRs = filteredPRs.filter((pr) => pr.draft);
    }

    // Apply sorting
    this.filteredIssues = this.sortItems(filteredIssues, this.selectedSort);
    this.filteredPullRequests = this.sortItems(filteredPRs, this.selectedSort);
  }

  sortItems(items: any[], sortBy: string): any[] {
    const sorted = [...items];

    switch (sortBy) {
      case 'updated-desc':
        return sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      case 'updated-asc':
        return sorted.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
      case 'created-desc':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'created-asc':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'title-asc':
        return sorted.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
      case 'title-desc':
        return sorted.sort((a, b) => b.title.toLowerCase().localeCompare(a.title.toLowerCase()));
      default:
        return sorted;
    }
  }

  getPrStatusClass(pr: any): string {
    if (pr.merged_at) return 'merged';
    if (pr.closed_at) return 'closed-pr';
    if (pr.draft) return 'draft';
    return 'open';
  }

  getPrIconClass(pr: any): string {
    if (pr.merged_at) return 'fas fa-code-branch';
    if (pr.closed_at) return 'fas fa-ban'; // Changed from fa-times-circle to fa-ban which is cleaner
    if (pr.draft) return 'far fa-file-alt';
    return 'fas fa-code-branch';
  }

  toggleView(view: 'issues' | 'pullRequests') {
    this.activeView = view;
  }

  openGitHubProfile(url: string) {
    if (url && isPlatformBrowser(this.platformId)) {
      window.open(url, '_blank');
    }
  }

  formatLastUpdated(date: string) {
    const updatedAt = new Date(date);
    return formatDistanceToNow(updatedAt, { addSuffix: true });
  }
  get hasData(): boolean {
    return (
      this.filteredIssues.length > 0 || this.filteredPullRequests.length > 0
    );
  }

  get openIssues(): number {
    return this.issues.filter((i) => !i.closed_at).length;
  }

  get closedIssues(): number {
    return this.issues.filter((i) => i.closed_at).length;
  }

  get openPRs(): number {
    return this.pullRequests.filter((pr) => !pr.closed_at).length;
  }

  get mergedOrClosedPRs(): number {
    return this.pullRequests.filter((pr) => pr.closed_at).length;
  }

  get memberSince(): string {
    if (!this.userProfile?.created_at) return '';
    const date = new Date(this.userProfile.created_at);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}