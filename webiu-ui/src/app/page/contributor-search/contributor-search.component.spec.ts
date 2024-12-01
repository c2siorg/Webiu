import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router'; // Import ActivatedRoute
import { of } from 'rxjs'; // Import of to return observables
import { ContributorSearchComponent } from './contributor-search.component';

describe('ContributorSearchComponent', () => {
  let component: ContributorSearchComponent;
  let fixture: ComponentFixture<ContributorSearchComponent>;

  // Mock ActivatedRoute
  const mockActivatedRoute = {
    queryParams: of({ username: 'someUsername' })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContributorSearchComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute } 
      ]
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
