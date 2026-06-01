import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router'; 
import { of } from 'rxjs'; 
import { ContributorSearchComponent } from './contributor-search.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrModule } from 'ngx-toastr';
describe('ContributorSearchComponent', () => {
  let component: ContributorSearchComponent;
  let fixture: ComponentFixture<ContributorSearchComponent>;

  
  const mockActivatedRoute = {
    queryParams: of({ username: 'someUsername' })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContributorSearchComponent, HttpClientTestingModule, ToastrModule.forRoot()],
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
