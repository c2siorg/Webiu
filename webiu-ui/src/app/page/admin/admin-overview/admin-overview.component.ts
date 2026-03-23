import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <div class="overview-container">
      <h2>Overview</h2>
      <mat-card class="placeholder-card">
        <mat-card-content>
          <p>Overview component - to be implemented</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .overview-container {
      padding: 2rem;
    }

    h2 {
      margin-top: 0;
      font-size: 1.75rem;
      color: #333;
    }

    .placeholder-card {
      margin-top: 1.5rem;
    }
  `],
})
export class AdminOverviewComponent {}
