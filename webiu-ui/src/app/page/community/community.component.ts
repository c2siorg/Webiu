import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Media, socialMedia } from '../../common/data/media';
import { Contributor } from '../../common/data/contributor';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ProfileCardComponent } from '../../components/profile-card/profile-card.component';
import { RouterModule } from '@angular/router';
import { BackToTopComponent } from '../../components/back-to-top/back-to-top.component';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [
    NavbarComponent,
    CommonModule,
    HttpClientModule,
    ProfileCardComponent,
    RouterModule,
    BackToTopComponent,
  ],
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss'],
})
export class CommunityComponent implements OnInit {
  private http = inject(HttpClient);
  icons: Media[] = socialMedia;
  users: Contributor[] = [];
  isLoading = true;

  ngOnInit() {
    this.getTopContributors();
  }

  getTopContributors() {
    this.http
      .get<Contributor[]>(`${environment.serverUrl}/api/contributor/contributors`)
      .subscribe({
        next: (res) => {
          const sorted = (res || []).sort(
            (a, b) => b.contributions - a.contributions,
          );
          this.users = sorted.slice(0, 8);
          this.fetchFollowerData();
        },
        error: () => {
          this.users = [];
          this.isLoading = false;
        },
      });
  }

  fetchFollowerData() {
    if (this.users.length === 0) {
      this.isLoading = false;
      return;
    }

    const usernames = this.users.map((u) => u.login);

    this.http
      .post<Record<string, { followers: number; following: number }>>(
        `${environment.serverUrl}/api/user/batch-social`,
        { usernames },
      )
      .subscribe({
        next: (data) => {
          this.users.forEach((user) => {
            const social = data[user.login];
            user.followers = social?.followers ?? 0;
            user.following = social?.following ?? 0;
          });
          this.isLoading = false;
        },
        error: () => {
          // Show contributors without social counts rather than failing entirely
          this.isLoading = false;
        },
      });
  }
}
