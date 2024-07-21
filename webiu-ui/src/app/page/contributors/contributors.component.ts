import { Component ,  } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { contributors , Contributor } from '../../common/data/contributer';
import { CommonModule } from '@angular/common';
import { ProfileCardComponent } from '../../components/profile-card/profile-card.component';

@Component({
  selector: 'app-contributors',
  standalone: true,
  imports: [NavbarComponent , ReactiveFormsModule,CommonModule,ProfileCardComponent],
  templateUrl: './contributors.component.html',
  styleUrl: './contributors.component.scss',
})
export class ContributorsComponent {
  profiles: Contributor[] = contributors;
  searchText = new FormControl('');
  selectedRepo:string = '';
  allRepos:string[] =[];
  constructor() {
    this.allRepos = this.getUniqueRepos();
  }

  getUniqueRepos(): string[] {
    const repos = this.profiles.flatMap(profile => profile.repos);
    return Array.from(new Set(repos));
  }
  onRepoChange(event:Event){
    const selectElement = event.target as HTMLSelectElement;
    this.selectedRepo = selectElement.value;
    this.filterProfiles();
  }


  filterProfiles() {
    let searchTextValue:string= this.searchText.value?.toLocaleLowerCase().trim()||'';
    this.profiles = contributors.filter( doc =>{
      return (searchTextValue?.length ? [doc.contributor_name , doc.github_username].some(str => str.toLocaleLowerCase().includes(searchTextValue)): true)
      && (this.selectedRepo?.length ? doc.repos.includes(this.selectedRepo):true)
    })

  }

}

