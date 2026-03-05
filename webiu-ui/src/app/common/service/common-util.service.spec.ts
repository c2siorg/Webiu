import { TestBed } from '@angular/core/testing';

import { CommonUtilService } from './common-util.service';

describe('CommonUtilService', () => {
  let service: CommonUtilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommonUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
