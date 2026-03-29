import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './email-verification.component.html',
  styleUrl: './email-verification.component.scss',
})
export class EmailVerificationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loading = true;
  success = false;
  message = 'Verifying your email address...';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading = false;
      this.success = false;
      this.message = 'Verification token is missing. Please use the link from your email.';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        this.message = response.message || 'Email verified successfully. Redirecting to login...';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1800);
      },
      error: (error) => {
        this.loading = false;
        this.success = false;
        this.message =
          error?.error?.message || 'Verification failed. The token may be invalid or expired.';
      },
    });
  }
}
