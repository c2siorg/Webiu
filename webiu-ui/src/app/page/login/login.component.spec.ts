import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter, Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService, AuthSession } from '../../services/auth.service';

describe('LoginComponent auth flow', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'parseUrl').and.returnValue({ queryParams: {} } as never);
    spyOn(router, 'navigateByUrl').and.returnValue(
      Promise.resolve(true),
    );

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('navigates admin users to /admin after login', () => {
    const session: AuthSession = {
      accessToken: 'token',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      user: {
        name: 'Admin',
        email: 'admin@webiu.local',
        role: 'admin',
      },
    };

    authService.login.and.returnValue(
      of<AuthSession>(session),
    );

    component.loginForm.setValue({
      email: 'admin@webiu.local',
      password: 'admin123',
    });

    component.submitLogin();

    expect(authService.login).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin');
  });
});
