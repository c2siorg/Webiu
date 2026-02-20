import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Media, socialMedia } from '../../common/data/media';
import { Contributor } from '../../common/data/contributor';
import { CommmonUtilService } from '../../common/service/commmon-util.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
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
  private commonUtil = inject(CommmonUtilService);
  private http = inject(HttpClient);
  icons: Media[] = socialMedia;
  users: Contributor[] = [];
  isLoading = true;
  showButton = false;

  ngOnInit() {
    this.getTopContributors();
  }

  getTopContributors() {
    this.http
      .get<
        Contributor[]
      >(`${environment.serverUrl}/api/contributor/contributors`)
      .subscribe({
        next: (res) => {
          // Sort by contributions in descending order, take top 9
          const sorted = (res || []).sort(
            (a, b) => b.contributions - a.contributions,
          );
          this.users = sorted.slice(0, 9);
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
      this.http.get(`https://api.github.com/users/${profile.login}`).subscribe({
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

  @HostListener('window:scroll')
  onWindowScroll() {
    // Show button when user scrolls down 100px from the top
    this.showButton = window.scrollY > 100;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
