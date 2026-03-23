import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <div class="settings-container">
      <h2>Settings</h2>
      <mat-card class="placeholder-card">
        <mat-card-content>
          <p>Settings component - to be implemented</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container {
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
export class AdminSettingsComponent {}
