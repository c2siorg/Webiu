import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';  
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
  activeView: 'issues' | 'pullRequests' = 'issues'; 
  userProfile: { login: string; avatar_url: string } | null = null; 
  private apiUrl = 'http://localhost:5000/api/contributor';

  constructor(private route: ActivatedRoute) {
    
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
      };
    } catch (error) {
      this.errorMessage = 'Failed to fetch data. Please check the username or try again later.';
    } finally {
      this.loading = false; 
    }
  }

  
  toggleView(view: 'issues' | 'pullRequests') {
    this.activeView = view;
  }
}

