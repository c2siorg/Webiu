import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';  // Import ActivatedRoute
import axios from 'axios';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  errorMessage: string = '';
  loading: boolean = false;
  private apiUrl = 'http://localhost:5000/api/contributor';

  constructor(private route: ActivatedRoute) {
    // Retrieve the username from the query parameters
    this.route.queryParams.subscribe((params) => {
      if (params['username']) {
        this.username = params['username'];
        this.onSearch();  // Automatically search when username is provided
      }
    });
  }

  async onSearch() {
    if (!this.username) {
      this.errorMessage = 'Please enter a username';
      return;
    }

    this.loading = true;
    this.errorMessage = ''; // Reset the error message

    try {
      // Fetch user issues
      const issuesResponse = await axios.get(`${this.apiUrl}/issues/${this.username}`);
      this.issues = issuesResponse.data.issues;

      // Fetch user pull requests
      const pullRequestsResponse = await axios.get(`${this.apiUrl}/pull-requests/${this.username}`);
      this.pullRequests = pullRequestsResponse.data.pullRequests;
    } catch (error) {
      this.errorMessage = 'Failed to fetch data. Please check the username or try again later.';
    } finally {
      this.loading = false; // Stop the loading state
    }
  }
}
