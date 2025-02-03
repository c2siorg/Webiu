import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import axios from 'axios';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { formatDistanceToNow } from 'date-fns';

@Component({
  selector: 'app-contributor-search',
  standalone: true,
  imports: [FormsModule, CommonModule],
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
  userProfile: { login: string; avatar_url: string; html_url: string } | null = null;
  private apiUrl = 'http://localhost:5001/api/contributor';

  constructor(private route: ActivatedRoute) {}

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
      const issuesResponse = await axios.get(`${this.apiUrl}/issues/${this.username}`);
      this.issues = issuesResponse.data.issues;

      const pullRequestsResponse = await axios.get(`${this.apiUrl}/pull-requests/${this.username}`);
      this.pullRequests = pullRequestsResponse.data.pullRequests;

      const userProfileResponse = await axios.get(`https://api.github.com/users/${this.username}`);
      this.userProfile = {
        login: userProfileResponse.data.login,
        avatar_url: userProfileResponse.data.avatar_url,
        html_url: userProfileResponse.data.html_url,
      };

      this.extractRepositories();
      this.filteredIssues = [...this.issues];
      this.filteredPullRequests = [...this.pullRequests];
    } catch (error) {
      this.errorMessage = 'Failed to fetch data. Please check the username or try again later.';
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
      // Ensure filtering is based on exact repository name
      this.filteredIssues = this.issues.filter((issue) => {
        const repoName = issue.repository_url.split('/').pop(); // Extract the repo name from the URL
        return repoName === selectedRepo; // Match with selected repo
      });
  
      this.filteredPullRequests = this.pullRequests.filter((pr) => {
        const repoName = pr.repository_url.split('/').pop(); // Extract the repo name from the URL
        return repoName === selectedRepo; // Match with selected repo
      });
    } else {
      // Reset to show all if no repository is selected
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
    return this.filteredIssues.length > 0 || this.filteredPullRequests.length > 0;
  }
  
}


