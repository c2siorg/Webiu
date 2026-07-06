import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AdminComponent } from './admin.component';
import { AuthService } from '../../services/auth.service';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let authService: AuthService;
  let router: Router;
  let toastr: ToastrService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, RouterTestingModule, AdminComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            checkSession: jasmine.createSpy().and.returnValue(of({ authenticated: false })),
            login: jasmine.createSpy().and.returnValue(of({ success: true })),
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

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    toastr = TestBed.inject(ToastrService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect if session is authenticated on init', () => {
    (authService.checkSession as jasmine.Spy).and.returnValue(of({ authenticated: true }));
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('should trigger toastr error if submitted without fields', () => {
    component.username = '';
    component.password = '';
    component.onSubmit();
    expect(toastr.error).toHaveBeenCalledWith('Please enter both username and password');
  });

  it('should authenticate and redirect on correct credentials', () => {
    component.username = 'admin';
    component.password = 'password';
    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({ username: 'admin', password: 'password' });
    expect(toastr.success).toHaveBeenCalledWith('Logged in successfully');
    expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('should handle login error gracefully', () => {
    (authService.login as jasmine.Spy).and.returnValue(throwError(() => new Error('Invalid credentials')));
    component.username = 'admin';
    component.password = 'wrong';
    component.onSubmit();

    expect(toastr.error).toHaveBeenCalled();
    expect(component.isLoading).toBe(false);
  });
});
