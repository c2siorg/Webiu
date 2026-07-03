import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminBaseComponent } from '../admin-base/admin-base.component';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss'],
})
export class AdminSettingsComponent extends AdminBaseComponent implements OnInit {
  private settingsService = inject(SettingsService);

  currentYear = new Date().getFullYear();
  showIdeasPage = true;
  registrationOpen = true;
  siteTitle = 'WebiU';
  siteDescription = '';
  maintenanceMode = false;
  isSaving = false;

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadSettings();
  }

  loadSettings(): void {
    this.settingsService.getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success && res?.settings) {
            const s = res.settings;
            this.currentYear = Number(s['gsoc.current_year']) || new Date().getFullYear();
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

    this.settingsService.updateSettings(updates)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.toastr.success(res.message || 'Settings updated successfully.');
          this.isSaving = false;
          if (res?.settings) {
            const s = res.settings;
            this.currentYear = Number(s['gsoc.current_year']) || new Date().getFullYear();
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
}
