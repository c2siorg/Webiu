import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AuthService } from '../../services/auth.service';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let authService: AuthService;
  let router: Router;
  let toastr: ToastrService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            logout: jasmine.createSpy().and.returnValue(of({ success: true })),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy(),
          },
        },
        {
          provide: ToastrService,
          useValue: {
            success: jasmine.createSpy(),
            error: jasmine.createSpy(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    toastr = TestBed.inject(ToastrService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call authService.logout and navigate on logout success', () => {
    component.onLogout();
    expect(authService.logout).toHaveBeenCalled();
    expect(toastr.success).toHaveBeenCalledWith('Logged out successfully');
    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('should handle logout errors gracefully', () => {
    (authService.logout as jasmine.Spy).and.returnValue(throwError(() => new Error('Error')));
    component.onLogout();
    expect(toastr.error).toHaveBeenCalledWith('Logout failed, please try again');
  });
});
