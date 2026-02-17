import { TestBed } from '@angular/core/testing';

import { CommmonUtilService } from './commmon-util.service';

describe('CommmonUtilService', () => {
  let service: CommmonUtilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommmonUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
