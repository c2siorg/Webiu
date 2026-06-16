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

  currentYear = 2026;
  showIdeasPage = true;
  registrationOpen = true;
  maintenanceMode = false;
  
  isLoading = true;
  isSyncing = false;
  isSunVisible = true;

  ngOnInit(): void {
    this.isSunVisible = !this.themeService.isDarkMode();
    this.loadSettings();
  }

  loadSettings(): void {
    this.settingsService.getSettings().subscribe({
      next: (res) => {
        if (res?.success && res?.settings) {
          const s = res.settings;
          this.currentYear = Number(s['gsoc.current_year']) || 2026;
          this.showIdeasPage = s['gsoc.show_ideas_page'] === true || s['gsoc.show_ideas_page'] === 'true';
          this.registrationOpen = s['gsoc.registration_open'] === true || s['gsoc.registration_open'] === 'true';
          this.maintenanceMode = s['site.maintenance_mode'] === true || s['site.maintenance_mode'] === 'true';
        }
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to load live settings on dashboard overview.');
        this.isLoading = false;
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
