import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Contributor, contributors } from '../../common/data/contributor';
import { CommonModule } from '@angular/common';
import { ProfileCardComponent } from '../../components/profile-card/profile-card.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CommmonUtilService } from '../../common/service/commmon-util.service';
import { environment } from '../../../environments/environment'; 
import { distinctUntilChanged } from 'rxjs/operators';

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
  styleUrls: ['./contributors.component.scss'],
})
export class ContributorsComponent implements OnInit {
  profiles: Contributor[] = [];
  displayProfiles: Contributor[] = [];
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

    this.searchText.valueChanges.pipe(distinctUntilChanged()).subscribe(() => {
      this.filterProfiles();
    });
  }

  getProfiles() {
    this.http
      .get<Contributor[]>(`${environment.serverUrl}/api/contributor/contributors`)
      .subscribe({
        next: (res) => this.handleProfileResponse(res || contributors),
        error: () => this.handleProfileResponse(contributors),
      });
  }

  handleProfileResponse(profiles: Contributor[]) {
    this.profiles = profiles;
    this.commonUtil.commonProfiles = this.profiles;
    this.allRepos = this.getUniqueRepos();
    this.totalPages = Math.ceil((this.profiles.length || 0) / this.profilesPerPage);
    this.filterProfiles();
    this.isLoading = false;
  }

  getUniqueRepos(): string[] {
    return Array.from(new Set(this.profiles.flatMap((profile) => profile.repos)));
  }

  onRepoChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedRepo = selectElement.value;
    this.filterProfiles();
  }

  filterProfiles() {
    const searchTextValue = this.searchText.value?.toLocaleLowerCase().trim() || '';
    const filteredProfiles = this.profiles.filter((doc) =>
      this.matchesSearchText(doc, searchTextValue) && this.matchesSelectedRepo(doc)
    );

    this.totalPages = Math.ceil(filteredProfiles.length / this.profilesPerPage);
    this.displayProfiles = filteredProfiles.slice(
      (this.currentPage - 1) * this.profilesPerPage,
      this.currentPage * this.profilesPerPage
    );
  }

  matchesSearchText(doc: Contributor, searchText: string): boolean {
    return !searchText.length || doc.login.toLocaleLowerCase().includes(searchText);
  }

  matchesSelectedRepo(doc: Contributor): boolean {
    return !this.selectedRepo.length || doc.repos.includes(this.selectedRepo);
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
