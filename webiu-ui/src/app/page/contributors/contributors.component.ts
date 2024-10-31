import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Contributor, contributors } from '../../common/data/contributor';
import { CommonModule } from '@angular/common';
import { ProfileCardComponent } from '../../components/profile-card/profile-card.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CommmonUtilService } from '../../common/service/commmon-util.service';
import { environment } from '../../../environments/environment'; 
@Component({
  selector: 'app-contributors',
  standalone: true,
  imports: [
    NavbarComponent,
    HttpClientModule,
    ReactiveFormsModule,
    CommonModule,
    ProfileCardComponent,
  ],
  templateUrl: './contributors.component.html',
  styleUrl: './contributors.component.scss',
})
export class ContributorsComponent implements OnInit {
  profiles?: Contributor[];
  displayProfiles?: Contributor[];
  searchText = new FormControl('');
  selectedRepo: string = '';
  allRepos: string[] = [];
  isLoading = true;

  currentPage = 1;
  profilesPerPage = 9;
  totalPages = 1;

  constructor(
    private http: HttpClient,
    private commonUtil: CommmonUtilService
  ) {}

  ngOnInit() {
    this.getProfiles();
    
    this.searchText.valueChanges.subscribe(() => {
    this.filterProfiles();
  });
  }

  getProfiles() {
    this.http
      .get<any>(`${environment.serverUrl}/api/contributor/contributors`)
      .subscribe({
        next: (res) => {
          if (res) {
            this.profiles = res;
            this.commonUtil.commonProfiles = this.profiles;
            this.allRepos = this.getUniqueRepos();
            this.totalPages = Math.ceil(
              (this.profiles?.length || 0) / this.profilesPerPage
            );
            this.filterProfiles();
            this.isLoading = false;
          } else {
            this.profiles = contributors.flatMap((profile: any) => profile);
            this.allRepos = this.getUniqueRepos();
            this.totalPages = Math.ceil(
              (this.profiles?.length || 0) / this.profilesPerPage
            );
            this.filterProfiles();
            this.isLoading = false;
          }
        },
        error: (error) => {
          this.profiles = contributors.map((profile) => profile);
          this.allRepos = this.getUniqueRepos();
          this.totalPages = Math.ceil(
            (this.profiles?.length || 0) / this.profilesPerPage
          );
          this.filterProfiles();
          this.isLoading = false;
        },
      });
  }

  getUniqueRepos(): string[] {
    let array: string[] = [];
    if (this.profiles?.length) {
      const repos = this.profiles.flatMap((profile) => profile.repos);
      array = Array.from(new Set(repos));
    }
    return array;
  }

  onRepoChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedRepo = selectElement.value;
    this.filterProfiles();
  }

  filterProfiles() {
    let searchTextValue: string =
      this.searchText.value?.toLocaleLowerCase().trim() || '';
    let filteredProfiles = this.profiles?.filter((doc) => {
      return (
        (searchTextValue?.length
          ? [doc.login].some((str) =>
              str.toLocaleLowerCase().includes(searchTextValue)
            )
          : true) &&
        (this.selectedRepo?.length
          ? doc.repos.includes(this.selectedRepo)
          : true)
      );
    });

    this.totalPages = Math.ceil(
      (filteredProfiles?.length || 0) / this.profilesPerPage
    );
    this.displayProfiles = filteredProfiles?.slice(
      (this.currentPage - 1) * this.profilesPerPage,
      this.currentPage * this.profilesPerPage
    );
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.filterProfiles();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.filterProfiles();
    }
  }
}
