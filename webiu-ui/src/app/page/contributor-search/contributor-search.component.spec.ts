import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs'; // Import 'of' to return observables
import { ContributorSearchComponent } from './contributor-search.component';

describe('ContributorSearchComponent', () => {
  let component: ContributorSearchComponent;
  let fixture: ComponentFixture<ContributorSearchComponent>;

  // Mock ActivatedRoute
  const mockActivatedRoute = {
    queryParams: of({ username: 'someUsername' }) // Provide a mock observable for queryParams
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

  it('should automatically search when username is provided in queryParams', () => {
    expect(component.username).toBe('someUsername');
    expect(component.onSearch).toHaveBeenCalled();
  });
});
