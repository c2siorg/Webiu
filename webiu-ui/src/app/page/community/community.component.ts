import { Component, inject, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Media, socialMedia } from '../../common/data/media';
import { Contributor } from '../../common/data/contributor';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private destroyRef = inject(DestroyRef);
  icons: Media[] = socialMedia;
  users: Contributor[] = [];
  isLoading = true;

  ngOnInit() {
    this.getTopContributors();
  }

  getTopContributors() {
    this.http
      .get<Contributor[]>(
        `${environment.serverUrl}/api/contributor/contributors`,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          // Sort by contributions in descending order, take top 9
          const sorted = (res || []).sort(
            (a, b) => b.contributions - a.contributions,
          );
          this.users = sorted.slice(0, 8);
          this.fetchFollowerData();
        },
        error: () => {
          console.error('Error fetching contributors');
          this.users = [];
          this.isLoading = false;
        },
      });
  }

  fetchFollowerData() {
    let requestsCompleted = 0;
    if (this.users.length === 0) {
      this.isLoading = false;
      return;
    }

    const checkCompletion = () => {
      requestsCompleted++;
      if (requestsCompleted === this.users.length) {
        this.isLoading = false;
      }
    };

    this.users.forEach((profile) => {
      this.http
        .get(`https://api.github.com/users/${profile.login}`)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
        next: (data: any) => {
          profile.followers = data.followers;
          profile.following = data.following;
          checkCompletion();
        },
        error: () => {
          console.error(`Error fetching followers for ${profile.login}`);
          checkCompletion();
        },
      });
    });
  }
}
