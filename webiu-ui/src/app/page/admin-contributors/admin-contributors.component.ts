import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { SettingsService } from '../../services/settings.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CountUpDirective } from '../../shared/count-up.directive';
import { AdminBaseComponent } from '../admin-base/admin-base.component';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-admin-contributors',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    BaseChartDirective,
    CountUpDirective,
  ],
  templateUrl: './admin-contributors.component.html',
  styleUrls: ['./admin-contributors.component.scss'],
})
export class AdminContributorsComponent extends AdminBaseComponent implements OnInit {
  private settingsService = inject(SettingsService);

  @ViewChild(BaseChartDirective) chartDirective?: BaseChartDirective;

  // Live analytics payload
  analyticsData: any = null;

  isLoading = true;
  hasError = false;

  // Expose Math to template
  protected readonly Math = Math;

  // Search, Sorting, and Pagination for Contributor Explorer
  searchText = '';
  sortKey = 'username';
  sortAscending = true;
  currentPage = 1;
  pageSize = 10;

  // Chart configs
  public repoParticipationChartData?: ChartConfiguration<'bar'>['data'];
  public repoParticipationChartOptions?: ChartConfiguration<'bar'>['options'];

  public distChartData?: ChartConfiguration<'bar'>['data'];
  public distChartOptions?: ChartConfiguration<'bar'>['options'];

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadAnalyticsData();
  }

  loadAnalyticsData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.settingsService.getContributorAnalytics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.analyticsData = data;
          this.initCharts(data);
          this.isLoading = false;
        },
        error: () => {
          this.toastr.error('Failed to load contributor intelligence analytics.');
          this.isLoading = false;
          this.hasError = true;
        },
      });
  }

  initCharts(data: any): void {
    const isDark = this.themeService.isDarkMode();
    const primaryText = isDark ? '#f8fafc' : '#0f172a';
    const mutedText = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

    const purpleColor = isDark ? 'rgba(168, 85, 247, 0.65)' : 'rgba(124, 58, 237, 0.65)';
    const purpleBorderColor = isDark ? '#a855f7' : '#7c3aed';

    const limeColor = isDark ? 'rgba(132, 204, 22, 0.65)' : 'rgba(101, 163, 13, 0.65)';
    const limeBorderColor = isDark ? '#84cc16' : '#65a30d';

    // 1. Repository Participation Horizontal Chart
    const repoLabels = (data.repositoryParticipation || []).map((r: any) => r.name);
    const repoCounts = (data.repositoryParticipation || []).map((r: any) => r.contributorCount);

    this.repoParticipationChartData = {
      labels: repoLabels,
      datasets: [
        {
          label: 'Contributors',
          data: repoCounts,
          backgroundColor: purpleColor,
          borderColor: purpleBorderColor,
          borderWidth: 1.5,
          borderRadius: 4,
        },
      ],
    };

    this.repoParticipationChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: mutedText, font: { family: 'Geist', size: 11 } },
        },
        y: {
          grid: { display: false },
          ticks: { color: primaryText, font: { family: 'Geist', size: 12, weight: 'bold' } },
        },
      },
    };

    // 2. Contribution Score Distribution Bar Chart
    const dist = data.distribution || {};
    const distLabels = ['1-5', '6-10', '11-50', '51-100', '100+'];
    const distCounts = [
      dist['1_5'] || 0,
      dist['6_10'] || 0,
      dist['11_50'] || 0,
      dist['51_100'] || 0,
      dist['100_plus'] || 0,
    ];

    this.distChartData = {
      labels: distLabels,
      datasets: [
        {
          label: 'Contributors Count',
          data: distCounts,
          backgroundColor: limeColor,
          borderColor: limeBorderColor,
          borderWidth: 1.5,
          borderRadius: 4,
        },
      ],
    };

    this.distChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: primaryText, font: { family: 'Geist', size: 12 } },
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: mutedText, font: { family: 'Geist', size: 11 } },
        },
      },
    };
  }

  // --- Contributor Explorer logic ---

  get filteredContributors(): any[] {
    if (!this.analyticsData?.explorer) return [];

    const search = this.searchText.toLowerCase().trim();
    const list = this.analyticsData.explorer.filter((c: any) => {
      return (
        (c.username || '').toLowerCase().includes(search) ||
        (c.login || '').toLowerCase().includes(search)
      );
    });

    // Sorting
    list.sort((a: any, b: any) => {
      let valA = a[this.sortKey];
      let valB = b[this.sortKey];

      // Handle cases where property might be undefined
      if (valA === undefined) valA = 0;
      if (valB === undefined) valB = 0;

      if (typeof valA === 'string') {
        return this.sortAscending
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return this.sortAscending ? valA - valB : valB - valA;
      }
    });

    return list;
  }

  get totalExplorerPages(): number {
    return Math.max(1, Math.ceil(this.filteredContributors.length / this.pageSize));
  }

  get paginatedContributors(): any[] {
    const list = this.filteredContributors;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  onSort(key: string): void {
    if (this.sortKey === key) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortKey = key;
      this.sortAscending = true;
    }
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalExplorerPages) return;
    this.currentPage = page;
  }

  private updateChartConfigs(isDark: boolean): void {
    if (!this.analyticsData) return;

    const primaryText = isDark ? '#f8fafc' : '#0f172a';
    const mutedText = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

    const purpleBg = isDark ? 'rgba(168, 85, 247, 0.65)' : 'rgba(124, 58, 237, 0.65)';
    const limeBg = isDark ? 'rgba(132, 204, 22, 0.65)' : 'rgba(101, 163, 13, 0.65)';

    // Update options & data datasets
    if (this.repoParticipationChartOptions?.scales?.['x']) {
      this.repoParticipationChartOptions.scales['x'].grid = { color: gridColor };
      this.repoParticipationChartOptions.scales['x'].ticks = { color: mutedText, font: { family: 'Geist', size: 11 } };
    }
    if (this.repoParticipationChartOptions?.scales?.['y']) {
      this.repoParticipationChartOptions.scales['y'].ticks = { color: primaryText, font: { family: 'Geist', size: 12, weight: 'bold' } };
    }
    if (this.repoParticipationChartData?.datasets?.[0]) {
      this.repoParticipationChartData.datasets[0].backgroundColor = purpleBg;
    }

    if (this.distChartOptions?.scales?.['x']) {
      this.distChartOptions.scales['x'].ticks = { color: primaryText, font: { family: 'Geist', size: 12 } };
    }
    if (this.distChartOptions?.scales?.['y']) {
      this.distChartOptions.scales['y'].grid = { color: gridColor };
      this.distChartOptions.scales['y'].ticks = { color: mutedText, font: { family: 'Geist', size: 11 } };
    }
    if (this.distChartData?.datasets?.[0]) {
      this.distChartData.datasets[0].backgroundColor = limeBg;
    }

    // Force update chart directive if exists
    if (this.chartDirective) {
      this.chartDirective.update();
    }
  }

  getFilteredExplorerList(): any[] {
    return this.filteredContributors;
  }

  getPaginatedExplorerList(): any[] {
    return this.paginatedContributors;
  }

  setSort(key: string): void {
    this.onSort(key);
  }

  getTotalPages(): number {
    return this.totalExplorerPages;
  }

  // --- Auth & Theme Toggle ---

  override toggleMode(): void {
    super.toggleMode();
    this.updateChartConfigs(this.themeService.isDarkMode());
  }
}
