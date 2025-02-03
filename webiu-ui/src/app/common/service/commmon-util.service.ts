import { HttpClient  } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { contributors, Contributor } from '../data/contributor';
import { FormControl } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class CommmonUtilService {
  commonProfiles?: Contributor[];
  commonDisplayProfiles?: Contributor[];
  searchText = new FormControl('');
  selectedRepo: string = '';
  commonAllRepos: string[] = [];

  constructor() {

  }
}
