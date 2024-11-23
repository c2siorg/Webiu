import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContributorSearchComponent } from './contributor-search.component';

describe('ContributorSearchComponent', () => {
  let component: ContributorSearchComponent;
  let fixture: ComponentFixture<ContributorSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContributorSearchComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContributorSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
