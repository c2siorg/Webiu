import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  loading = false;
  errorMessage = '';

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submitLogin() {
    if (this.loginForm.invalid || this.loading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.getRawValue() as never).subscribe({
      next: (session) => {
        const returnUrl = this.router.parseUrl(this.router.url).queryParams[
          'returnUrl'
        ];

        this.router.navigateByUrl(returnUrl || (session.user.role === 'admin' ? '/admin' : '/'));
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to login. Check your credentials and try again.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  loginWithGoogle() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.location.href = `${environment.serverUrl}/auth/google`;
  }

  loginWithGitHub() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.location.href = `${environment.serverUrl}/auth/github`;
  }
}
