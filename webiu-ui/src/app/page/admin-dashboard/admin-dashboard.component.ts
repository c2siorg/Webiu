import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminBaseComponent } from '../admin-base/admin-base.component';

export interface DashboardSummary {
  activeGsocYear: number;
  maintenanceMode: boolean;
  showIdeasPage: boolean;
  registrationOpen: boolean;
  totalProjects: number;
  totalContributors: number;
  totalIdeas: number;
  totalMentors: number;
  lastRepositorySync?: string | Date;
  recentAuditEvents?: any[];
  programs?: number;
  repositories?: number;
  contributors?: number;
  ideas?: number;
  publishedIdeas?: number;
  draftIdeas?: number;
  mentors?: number;
  syncHealth?: string;
  lastWebhookAt?: string | Date;
  lastReconciliationAt?: string | Date;
  environment?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent extends AdminBaseComponent implements OnInit {
  private settingsService = inject(SettingsService);

  // Aggregated data payload
  dashboardData: DashboardSummary | null = null;
  
  // Legacy / backup properties
  currentYear = new Date().getFullYear();
  maintenanceMode = false;
  showIdeasPage = true;
  registrationOpen = true;
  
  isLoading = true;
  hasError = false;
  isSyncing = false;

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.settingsService.getDashboardSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          if (data) {
            this.currentYear = data.activeGsocYear || new Date().getFullYear();
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

    this.settingsService.syncRepositories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
}
