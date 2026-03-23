import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule],
  template: `
    <div class="users-container">
      <h2>Users Management</h2>
      <mat-card class="placeholder-card">
        <mat-card-content>
          <p>Users management component - to be implemented</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .users-container {
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
export class AdminUsersComponent {}
