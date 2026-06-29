import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { ThemeService } from '../../services/theme.service';
import { ToastrService } from 'ngx-toastr';
import { CountUpDirective } from '../../shared/count-up.directive';

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
export class AdminContributorsComponent implements OnInit {
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  @ViewChild(BaseChartDirective) chartDirective?: BaseChartDirective;

  // Live analytics payload
  analyticsData: any = null;

  isLoading = true;
  hasError = false;
  isSunVisible = true;

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

  ngOnInit(): void {
    this.isSunVisible = !this.themeService.isDarkMode();
    this.loadAnalyticsData();
  }

  loadAnalyticsData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.settingsService.getContributorAnalytics().subscribe({
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
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };

    this.repoParticipationChartOptions = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: { color: mutedText, stepSize: 1 },
          grid: { color: gridColor },
        },
        y: {
          ticks: { color: primaryText },
          grid: { display: false },
        },
      },
    };

    // 2. Contribution Distribution Vertical Chart
    const distLabels = (data.contributionDistribution || []).map((d: any) => d.range);
    const distCounts = (data.contributionDistribution || []).map((d: any) => d.count);

    this.distChartData = {
      labels: distLabels,
      datasets: [
        {
          label: 'Contributors Count',
          data: distCounts,
          backgroundColor: limeColor,
          borderColor: limeBorderColor,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };

    this.distChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: { color: primaryText },
          grid: { display: false },
        },
        y: {
          ticks: { color: mutedText, stepSize: 1 },
          grid: { color: gridColor },
        },
      },
    };
  }

  updateChartConfigs(isDark: boolean): void {
    if (!this.analyticsData) return;

    const primaryText = isDark ? '#f8fafc' : '#0f172a';
    const mutedText = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

    const purpleColor = isDark ? 'rgba(168, 85, 247, 0.65)' : 'rgba(124, 58, 237, 0.65)';
    const purpleBorderColor = isDark ? '#a855f7' : '#7c3aed';

    const limeColor = isDark ? 'rgba(132, 204, 22, 0.65)' : 'rgba(101, 163, 13, 0.65)';
    const limeBorderColor = isDark ? '#84cc16' : '#65a30d';

    if (this.repoParticipationChartData?.datasets?.[0]) {
      this.repoParticipationChartData.datasets[0].backgroundColor = purpleColor;
      this.repoParticipationChartData.datasets[0].borderColor = purpleBorderColor;
    }
    if (this.repoParticipationChartOptions?.scales) {
      if (this.repoParticipationChartOptions.scales['x']) {
        this.repoParticipationChartOptions.scales['x'].ticks = { color: mutedText };
        this.repoParticipationChartOptions.scales['x'].grid = { color: gridColor };
      }
      if (this.repoParticipationChartOptions.scales['y']) {
        this.repoParticipationChartOptions.scales['y'].ticks = { color: primaryText };
      }
    }

    if (this.distChartData?.datasets?.[0]) {
      this.distChartData.datasets[0].backgroundColor = limeColor;
      this.distChartData.datasets[0].borderColor = limeBorderColor;
    }
    if (this.distChartOptions?.scales) {
      if (this.distChartOptions.scales['x']) {
        this.distChartOptions.scales['x'].ticks = { color: primaryText };
      }
      if (this.distChartOptions.scales['y']) {
        this.distChartOptions.scales['y'].ticks = { color: mutedText };
        this.distChartOptions.scales['y'].grid = { color: gridColor };
      }
    }

    // Force chart components update
    if (this.chartDirective) {
      this.chartDirective.update();
    }
  }

  // --- Explorer Filter, Sorting & Pagination ---

  getFilteredExplorerList(): any[] {
    if (!this.analyticsData || !this.analyticsData.explorer) return [];

    let list = [...this.analyticsData.explorer];

    // 1. Search Filter
    if (this.searchText.trim()) {
      const searchLower = this.searchText.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.username.toLowerCase().includes(searchLower) ||
          (c.repos && c.repos.some((r: string) => r.toLowerCase().includes(searchLower)))
      );
    }

    // 2. Sorting
    list.sort((a, b) => {
      let valA: any = a[this.sortKey];
      let valB: any = b[this.sortKey];

      // Handle username case-insensitive
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.sortAscending ? -1 : 1;
      if (valA > valB) return this.sortAscending ? 1 : -1;
      return 0;
    });

    return list;
  }

  getPaginatedExplorerList(): any[] {
    const list = this.getFilteredExplorerList();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  getTotalPages(): number {
    const count = this.getFilteredExplorerList().length;
    return Math.ceil(count / this.pageSize) || 1;
  }

  setSort(key: string): void {
    if (this.sortKey === key) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortKey = key;
      this.sortAscending = true;
    }
    this.currentPage = 1; // reset page on sort
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  // --- Auth & Theme Toggle ---

  toggleMode(): void {
    this.themeService.toggleDarkMode();
    this.isSunVisible = !this.themeService.isDarkMode();
    this.updateChartConfigs(this.themeService.isDarkMode());
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
