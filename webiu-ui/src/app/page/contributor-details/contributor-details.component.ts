import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-contributor-details',
  templateUrl: './contributor-details.component.html',
})
export class ContributorDetailsComponent implements OnInit {
  issues: any[] = [];
  pullRequests: any[] = [];

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    const login = this.route.snapshot.paramMap.get('contributorLogin');
    this.fetchContributorDetails(login);
  }

  fetchContributorDetails(login: string | null) {
    if (login) {
      this.http
      .get<any>(`http://localhost:5000/api/contributor/contributors/${login}/details`)
        .subscribe((res) => {
          this.issues = res.issues;
          this.pullRequests = res.pullRequests;
        }, error => {
          console.error('Error fetching contributor details:', error);
        });
    }
  }
}
