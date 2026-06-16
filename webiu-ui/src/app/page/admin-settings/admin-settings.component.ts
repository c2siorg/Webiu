import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss'],
})
export class AdminSettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  currentYear = 2026;
  showIdeasPage = true;
  registrationOpen = true;
  siteTitle = 'WebiU';
  siteDescription = '';
  maintenanceMode = false;
  isSaving = false;

  ngOnInit(): void {
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
          this.siteTitle = s['site.title'] || 'WebiU';
          this.siteDescription = s['site.description'] || '';
          this.maintenanceMode = s['site.maintenance_mode'] === true || s['site.maintenance_mode'] === 'true';
        }
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Failed to load system settings';
        this.toastr.error(errorMsg);
      },
    });
  }

  onSave(): void {
    this.isSaving = true;
    const updates = {
      'gsoc.current_year': this.currentYear,
      'gsoc.show_ideas_page': this.showIdeasPage,
      'gsoc.registration_open': this.registrationOpen,
      'site.title': this.siteTitle,
      'site.description': this.siteDescription,
      'site.maintenance_mode': this.maintenanceMode,
    };

    this.settingsService.updateSettings(updates).subscribe({
      next: (res) => {
        this.toastr.success(res.message || 'Settings updated successfully.');
        this.isSaving = false;
        if (res?.settings) {
          const s = res.settings;
          this.currentYear = Number(s['gsoc.current_year']) || 2026;
          this.showIdeasPage = s['gsoc.show_ideas_page'] === true;
          this.registrationOpen = s['gsoc.registration_open'] === true;
          this.siteTitle = s['site.title'] || 'WebiU';
          this.siteDescription = s['site.description'] || '';
          this.maintenanceMode = s['site.maintenance_mode'] === true;
        }
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Failed to update settings.';
        this.toastr.error(errorMsg);
        this.isSaving = false;
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
}
