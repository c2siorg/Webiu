
import { Injectable } from '@angular/core';
import { Contributor } from '../data/contributor';
import { FormControl } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class CommonUtilService {
  commonProfiles?: Contributor[];
  commonDisplayProfiles?: Contributor[];
  searchText = new FormControl('');
  selectedRepo = '';
  commonAllRepos: string[] = [];
}
