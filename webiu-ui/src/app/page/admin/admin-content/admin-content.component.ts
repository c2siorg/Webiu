import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin-content',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <div class="content-container">
      <h2>Content Management</h2>
      <mat-card class="placeholder-card">
        <mat-card-content>
          <p>Content management component - to be implemented</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .content-container {
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
export class AdminContentComponent {}
