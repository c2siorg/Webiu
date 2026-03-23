import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="unauthorized-container">
      <mat-card class="unauthorized-card">
        <mat-card-header>
          <mat-icon class="unauthorized-icon">block</mat-icon>
        </mat-card-header>
        <mat-card-content>
          <h1 class="title">Access Denied</h1>
          <p class="subtitle">You do not have permission to access this page.</p>
          <p class="message">
            This admin area is restricted to authorized users only. If you believe you should have access, please contact the administrator.
          </p>
          <div class="actions">
            <button mat-raised-button color="primary" (click)="goHome()">
              Go to Home
            </button>
            <button mat-stroked-button color="primary" (click)="goBack()">
              Go Back
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .unauthorized-card {
      width: 100%;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    mat-card-header {
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .unauthorized-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #f44336;
    }

    .title {
      margin: 0 0 0.5rem;
      font-size: 2rem;
      font-weight: 600;
      color: #333;
    }

    .subtitle {
      margin: 0 0 1rem;
      font-size: 1.1rem;
      color: #666;
      font-weight: 500;
    }

    .message {
      margin: 0 0 2rem;
      color: #999;
      line-height: 1.6;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;

      @media (max-width: 480px) {
        flex-direction: column;
      }
    }

    button {
      min-width: 120px;
    }
  `],
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    window.history.back();
  }
}
