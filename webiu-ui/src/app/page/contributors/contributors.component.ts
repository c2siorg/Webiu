import { Component , OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Contributor, contributors } from '../../common/data/contributor';
import { CommonModule } from '@angular/common';
import { ProfileCardComponent } from '../../components/profile-card/profile-card.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CommmonUtilService } from '../../common/service/commmon-util.service';
@Component({
  selector: 'app-contributors',
  standalone: true,
  imports: [NavbarComponent, HttpClientModule , ReactiveFormsModule,CommonModule,ProfileCardComponent],
  templateUrl: './contributors.component.html',
  styleUrl: './contributors.component.scss',
})
export class ContributorsComponent implements OnInit {
  profiles?: Contributor[];
  displayProfiles?: Contributor[];
  searchText = new FormControl('');
  selectedRepo:string = '';
  allRepos:string[] =[];
  constructor(
    private http: HttpClient,
    private commonUtil : CommmonUtilService,
  ) {
    
  }

  ngOnInit(){
    this.getProfiles()
  }

  
  getProfiles(){
    this.http.get<any>('http://localhost:5000/api/contributor/contributors').subscribe({
      next: (res)=>{
       if(res){
        this.profiles = res;
        this.commonUtil.commonProfiles = this.profiles;
        this.displayProfiles = this.profiles;
        this.commonUtil.commonDisplayProfiles = this.displayProfiles;
        this.allRepos = this.getUniqueRepos();
        this.commonUtil.commonAllRepos = this.allRepos
      }
      else{
        this.profiles = contributors.flatMap((profile: any)=>profile);
        this.displayProfiles = this.profiles;
        this.allRepos = this.getUniqueRepos()
      }
      },
      error: (error)=>{
        this.profiles = contributors.map((profile)=>profile);
        console.log(error);
        this.displayProfiles = this.profiles;
        this.allRepos = this.getUniqueRepos()
        }
      })
    
  }

  getUniqueRepos(): string[] {
    let array: string[] = []
    if( this.profiles?.length){
      const repos = this.profiles.flatMap(profile => profile.repos);
      array =  Array.from(new Set(repos));
    }
    return array
  }
  onRepoChange(event:Event){
    const selectElement = event.target as HTMLSelectElement;
    this.selectedRepo = selectElement.value;
    this.filterProfiles();
  }


  filterProfiles() {
    let searchTextValue:string= this.searchText.value?.toLocaleLowerCase().trim()||'';
    this.displayProfiles = this.profiles?.filter( doc =>{
      return (searchTextValue?.length ? [doc.login].some(str => str.toLocaleLowerCase().includes(searchTextValue)): true)
      && (this.selectedRepo?.length ? doc.repos.includes(this.selectedRepo):true)
    })

  }

}

