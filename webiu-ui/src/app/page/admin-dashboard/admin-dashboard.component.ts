import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  AdminDashboardResponse,
  AuthService,
} from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly user = this.authService.currentUser;
  loading = true;
  errorMessage = '';
  dashboard: AdminDashboardResponse | null = null;

  ngOnInit(): void {
    this.authService.getAdminDashboard().subscribe({
      next: (response) => {
        this.dashboard = response;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Failed to load dashboard data.';
        this.loading = false;
      },
    });
  }
}
