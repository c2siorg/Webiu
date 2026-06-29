import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { ThemeService } from '../../services/theme.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  // Aggregated data payload
  dashboardData: any = null;
  
  // Legacy / backup properties
  currentYear = 2026;
  maintenanceMode = false;
  showIdeasPage = true;
  registrationOpen = true;
  
  isLoading = true;
  hasError = false;
  isSyncing = false;
  isSunVisible = true;

  ngOnInit(): void {
    this.isSunVisible = !this.themeService.isDarkMode();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.settingsService.getDashboardSummary().subscribe({
      next: (data) => {
        this.dashboardData = data;
        if (data) {
          this.currentYear = data.activeGsocYear || 2026;
          this.maintenanceMode = data.maintenanceMode || false;
          this.showIdeasPage = data.showIdeasPage !== false;
          this.registrationOpen = data.registrationOpen !== false;
        }
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to load live administrative dashboard overview.');
        this.isLoading = false;
        this.hasError = true;
      },
    });
  }

  onSync(): void {
    this.isSyncing = true;
    this.toastr.info('Starting manual repository synchronization...', 'Sync Started');

    this.settingsService.syncRepositories().subscribe({
      next: (res) => {
        this.toastr.success(res.message || 'Repositories and contributors synchronized successfully.');
        this.isSyncing = false;
        this.loadDashboardData(); // Refresh the dashboard stats live
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Failed to sync repositories.';
        this.toastr.error(errorMsg);
        this.isSyncing = false;
      },
    });
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.toastr.success('Logged out successfully');
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.toastr.error('Logout failed, please try again');
      },
    });
  }

  toggleMode(): void {
    this.themeService.toggleDarkMode();
    this.isSunVisible = !this.themeService.isDarkMode();
  }
}
