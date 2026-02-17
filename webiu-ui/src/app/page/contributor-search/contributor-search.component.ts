import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import axios from 'axios';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { formatDistanceToNow } from 'date-fns';
import { environment } from '../../../environments/environment';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-contributor-search',
  standalone: true,
  imports: [FormsModule, CommonModule, LoadingSpinnerComponent],
  templateUrl: './contributor-search.component.html',
  styleUrls: ['./contributor-search.component.scss'],
})
export class ContributorSearchComponent {
  username: string = '';
  issues: any[] = [];
  pullRequests: any[] = [];
  uniqueRepositories: string[] = [];
  filteredIssues: any[] = [];
  filteredPullRequests: any[] = [];
  errorMessage: string = '';
  loading: boolean = false;
  activeView: 'issues' | 'pullRequests' = 'issues';
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

  constructor(private route: ActivatedRoute) { }

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
      const issuesResponse = await axios.get(
        `${this.apiUrl}/issues/${this.username}`
      );
      this.issues = issuesResponse.data.issues;

      const pullRequestsResponse = await axios.get(
        `${this.apiUrl}/pull-requests/${this.username}`
      );
      this.pullRequests = pullRequestsResponse.data.pullRequests;

      const userProfileResponse = await axios.get(
        `https://api.github.com/users/${this.username}`
      );
      this.userProfile = {
        login: userProfileResponse.data.login,
        avatar_url: userProfileResponse.data.avatar_url,
        html_url: userProfileResponse.data.html_url,
        name: userProfileResponse.data.name,
        bio: userProfileResponse.data.bio,
        location: userProfileResponse.data.location,
        followers: userProfileResponse.data.followers || 0,
        following: userProfileResponse.data.following || 0,
        created_at: userProfileResponse.data.created_at,
      };

      this.extractRepositories();
      this.filteredIssues = [...this.issues];
      this.filteredPullRequests = [...this.pullRequests];
    } catch (error) {
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
    const selectedRepo = (event.target as HTMLSelectElement).value;

    if (selectedRepo) {
      this.filteredIssues = this.issues.filter((issue) => {
        const repoName = issue.repository_url.split('/').pop();
        return repoName === selectedRepo;
      });

      this.filteredPullRequests = this.pullRequests.filter((pr) => {
        const repoName = pr.repository_url.split('/').pop();
        return repoName === selectedRepo;
      });
    } else {
      this.filteredIssues = [...this.issues];
      this.filteredPullRequests = [...this.pullRequests];
    }
  }

  toggleView(view: 'issues' | 'pullRequests') {
    this.activeView = view;
  }

  openGitHubProfile(url: string) {
    if (url) {
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