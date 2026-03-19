import { Component, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Media, socialMedia } from '../../common/data/media';
import { Contributor } from '../../common/data/contributor';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ProfileCardComponent } from '../../components/profile-card/profile-card.component';
import { RouterModule } from '@angular/router';


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
  users: Contributor[] = [];
  isLoading = true;

  ngOnInit() {
    this.getTopContributors();
  }

  getTopContributors() {
    this.http
 fix/github-rate-limit-handling
      .get<Contributor[]>(`${environment.serverUrl}/api/contributor/contributors`)

      .get<Contributor[]>(`${environment.serverUrl}/api/v1/contributor/contributors`)
      .pipe(takeUntilDestroyed(this.destroyRef))
 webiu-2026-pre-gsoc
      .subscribe({
        next: (res) => {
          const sorted = (res || []).sort(
            (a, b) => b.contributions - a.contributions,
          );
          this.users = sorted.slice(0, 8);
          this.fetchFollowerData();
        },
 fix/github-rate-limit-handling
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching contributors', {
            status: error.status,
            message: error.message,
            body: error.error,
          });

        error: (error) => {
          console.warn('Error fetching contributors:', error);
 webiu-2026-pre-gsoc
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

 fix/github-rate-limit-handling
    const usernames = this.users.map((profile) => profile.login);

    this.http
      .post<Record<string, { followers: number; following: number }>>(
        `${environment.serverUrl}/api/user/batch-social`,
        { usernames },
      )
      .subscribe({
        next: (data) => {
          this.users = this.users.map((profile) => {
            // Guard against null/undefined data
            const socials = data ?? {};
            const social = socials[profile.login] ?? null;
            return {
              ...profile,
              followers: social?.followers ?? 0,
              following: social?.following ?? 0,
            };
          });
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching followers and following data', {
            status: error.status,
            message: error.message,
            body: error.error,
          });
          this.users = this.users.map((profile) => ({
            ...profile,
            followers: profile.followers ?? 0,
            following: profile.following ?? 0,
          }));

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
            user.followers = social?.followers ?? 0;
            user.following = social?.following ?? 0;
          });
          this.isLoading = false;
        },
        error: (error) => {
          console.warn('Error fetching follower data:', error);
          // Show contributors without social counts rather than failing entirely
 webiu-2026-pre-gsoc
          this.isLoading = false;
        },
      });
  }
}
