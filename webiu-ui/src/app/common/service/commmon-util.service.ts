import { Injectable } from '@angular/core';
import { Contributor } from '../data/contributor';
import { FormControl } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class CommmonUtilService {
  commonProfiles?: Contributor[];
  commonDisplayProfiles?: Contributor[];
  searchText = new FormControl('');
  selectedRepo = '';
  commonAllRepos: string[] = [];

  
  // getProfiles() {
  //   this.http.get<any>('http://localhost:5000/api/contributor/contributors').subscribe({
  //     next: (res) => {
  //       if (res) {
  //         this.commonAllPro = res;
  //         this.displayProfiles = this.profiles;
  //         this.allRepos = this.getUniqueRepos();
  //       }
  //       else {
  //         this.profiles = contributers.flatMap((profile: any) => profile);
  //         this.displayProfiles = this.profiles;
  //         this.allRepos = this.getUniqueRepos()
  //       }
  //     },
  //     error: (error) => {
  //       this.profiles = contributers.map((profile) => profile);
  //       console.log(error);
  //       this.displayProfiles = this.profiles;
  //       this.allRepos = this.getUniqueRepos()
  //     }
  //   })

  // }

  // getUniqueRepos(): string[] {
  //   let array: string[] = []
  //   if (this.profiles?.length) {
  //     const repos = this.profiles.flatMap(profile => profile.repos);
  //     array = Array.from(new Set(repos));
  //   }
  //   return array
  // }
}
