import { Component, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Media, socialMedia } from '../../common/data/media';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ProfileCardComponent } from '../../components/profile-card/profile-card.component';
import { RouterModule } from '@angular/router';
import { GithubContributor } from '../../models/github.model';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [
    NavbarComponent,
    CommonModule,
    HttpClientModule,
    ProfileCardComponent,
    RouterModule,
  ],
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss'],
})
export class CommunityComponent implements OnInit {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  icons: Media[] = socialMedia;
  users: GithubContributor[] = [];
  isLoading = true;

  ngOnInit() {
    this.getTopContributors();
  }

  getTopContributors() {
    this.http
      .get<GithubContributor[]>(
        `${environment.serverUrl}/api/v1/contributor/contributors`,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const sorted = (res || []).sort(
            (a, b) => b.contributions - a.contributions,
          );
          this.users = sorted.slice(0, 8);
          this.fetchFollowerData();
        },
        error: (error) => {
          console.warn('Error fetching contributors:', error);
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
        `${environment.serverUrl}/api/v1/user/batch-social`,
        { usernames },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.users.forEach((user) => {
            const social = data[user.login];
            // ← Fix: Bracket notation for index signature safety (TS4111 resolved)
            (user as any)['followers'] = social?.followers ?? 0;
            (user as any)['following'] = social?.following ?? 0;
          });
          this.isLoading = false;
        },
        error: (error) => {
          console.warn('Error fetching follower data:', error);
          // Show contributors without social counts rather than failing entirely
          this.isLoading = false;
        },
      });
  }
}
