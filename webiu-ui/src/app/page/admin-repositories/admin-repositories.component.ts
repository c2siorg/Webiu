import { Component, OnInit, inject, ViewChildren, QueryList } from '@angular/core';
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
  selector: 'app-admin-repositories',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    BaseChartDirective,
    CountUpDirective,
  ],
  templateUrl: './admin-repositories.component.html',
  styleUrls: ['./admin-repositories.component.scss'],
})
export class AdminRepositoriesComponent implements OnInit {
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  @ViewChildren(BaseChartDirective) chartDirectives?: QueryList<BaseChartDirective>;

  analyticsData: any = null;
  isLoading = true;
  hasError = false;
  isSunVisible = true;

  protected readonly Math = Math;

  // Search, Sorting, and Pagination for Repository Explorer
  searchText = '';
  sortKey = 'name';
  sortAscending = true;
  currentPage = 1;
  pageSize = 10;

  // Chart configs
  // 1. Repository Popularity (Horizontal Bar Chart)
  public popularityChartData?: ChartConfiguration<'bar'>['data'];
  public popularityChartOptions?: ChartConfiguration<'bar'>['options'];

  // 2. Contributor Distribution (Horizontal Bar Chart)
  public contributorChartData?: ChartConfiguration<'bar'>['data'];
  public contributorChartOptions?: ChartConfiguration<'bar'>['options'];

  // 3. Fork Distribution (Vertical Bar Chart)
  public forkChartData?: ChartConfiguration<'bar'>['data'];
  public forkChartOptions?: ChartConfiguration<'bar'>['options'];

  // 4. Topic Distribution (Doughnut Chart)
  public topicChartData?: ChartConfiguration<'doughnut'>['data'];
  public topicChartOptions?: ChartConfiguration<'doughnut'>['options'];

  // 5. Visibility Distribution (Pie Chart)
  public visibilityChartData?: ChartConfiguration<'pie'>['data'];
  public visibilityChartOptions?: ChartConfiguration<'pie'>['options'];

  // 6. Language Distribution (Horizontal Bar Chart)
  public languageChartData?: ChartConfiguration<'bar'>['data'];
  public languageChartOptions?: ChartConfiguration<'bar'>['options'];

  ngOnInit(): void {
    this.isSunVisible = !this.themeService.isDarkMode();
    this.loadAnalyticsData();
  }

  loadAnalyticsData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.settingsService.getRepositoryAnalytics().subscribe({
      next: (data) => {
        this.analyticsData = data;
        this.initCharts(data);
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to load repository intelligence analytics.');
        this.isLoading = false;
        this.hasError = true;
      },
    });
  }

  initCharts(data: any): void {
    const isDark = this.themeService.isDarkMode();
    this.applyChartThemes(isDark, data);
  }

  applyChartThemes(isDark: boolean, data: any): void {
    if (!data) return;

    const primaryText = isDark ? '#f8fafc' : '#0f172a';
    const mutedText = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

    // Palette Colors
    const colorStars = isDark ? 'rgba(245, 158, 11, 0.65)' : 'rgba(217, 119, 6, 0.65)'; // Amber
    const borderStars = isDark ? '#f59e0b' : '#d97706';

    const colorContributors = isDark ? 'rgba(168, 85, 247, 0.65)' : 'rgba(124, 58, 237, 0.65)'; // Purple
    const borderContributors = isDark ? '#a855f7' : '#7c3aed';

    const colorForks = isDark ? 'rgba(6, 182, 212, 0.65)' : 'rgba(8, 145, 178, 0.65)'; // Cyan
    const borderForks = isDark ? '#06b6d4' : '#0891b2';

    const colorLanguages = isDark ? 'rgba(132, 204, 22, 0.65)' : 'rgba(101, 163, 13, 0.65)'; // Lime
    const borderLanguages = isDark ? '#84cc16' : '#65a30d';

    // Doughnut/Pie Palettes (using curated colors)
    const chartPalette = [
      isDark ? '#a855f7' : '#7c3aed', // purple
      isDark ? '#06b6d4' : '#0891b2', // cyan
      isDark ? '#f59e0b' : '#d97706', // amber
      isDark ? '#84cc16' : '#65a30d', // lime
      isDark ? '#ef4444' : '#dc2626', // red
      isDark ? '#3b82f6' : '#2563eb', // blue
    ];

    // 1. Popularity Chart (Top Stars)
    const popRepos = (data.popularRepositories || []).slice(0, 6);
    this.popularityChartData = {
      labels: popRepos.map((r: any) => r.name),
      datasets: [
        {
          label: 'Stars',
          data: popRepos.map((r: any) => r.stars),
          backgroundColor: colorStars,
          borderColor: borderStars,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
    this.popularityChartOptions = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: mutedText }, grid: { color: gridColor } },
        y: { ticks: { color: primaryText }, grid: { display: false } },
      },
    };

    // 2. Contributor Chart (Top Communities)
    const partRepos = (data.repositoryParticipation || []).slice(0, 6);
    this.contributorChartData = {
      labels: partRepos.map((r: any) => r.name),
      datasets: [
        {
          label: 'Contributors',
          data: partRepos.map((r: any) => r.contributorCount),
          backgroundColor: colorContributors,
          borderColor: borderContributors,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
    this.contributorChartOptions = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: mutedText, stepSize: 1 }, grid: { color: gridColor } },
        y: { ticks: { color: primaryText }, grid: { display: false } },
      },
    };

    // 3. Fork Chart
    const forkRepos = (data.forkDistribution || []).slice(0, 6);
    this.forkChartData = {
      labels: forkRepos.map((r: any) => r.name),
      datasets: [
        {
          label: 'Forks',
          data: forkRepos.map((r: any) => r.forks),
          backgroundColor: colorForks,
          borderColor: borderForks,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
    this.forkChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: primaryText }, grid: { display: false } },
        y: { ticks: { color: mutedText, stepSize: 1 }, grid: { color: gridColor } },
      },
    };

    // 4. Topic Distribution Doughnut Chart
    const topTopics = (data.topicDistribution || []).slice(0, 6);
    this.topicChartData = {
      labels: topTopics.map((t: any) => t.topic),
      datasets: [
        {
          data: topTopics.map((t: any) => t.count),
          backgroundColor: chartPalette,
          borderWidth: 0,
        },
      ],
    };
    this.topicChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: primaryText, font: { family: 'Outfit, sans-serif' } },
        },
      },
    };

    // 5. Visibility Distribution Pie Chart
    const visData = data.visibilityDistribution || {};
    this.visibilityChartData = {
      labels: ['Public', 'Private', 'Archived'],
      datasets: [
        {
          data: [visData.public || 0, visData.private || 0, visData.archived || 0],
          backgroundColor: [
            isDark ? '#84cc16' : '#65a30d', // Green for public
            isDark ? '#f59e0b' : '#d97706', // Yellow for private
            isDark ? '#ef4444' : '#dc2626', // Red for archived
          ],
          borderWidth: 0,
        },
      ],
    };
    this.visibilityChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: primaryText, font: { family: 'Outfit, sans-serif' } },
        },
      },
    };

    // 6. Language Distribution Horizontal Bar Chart
    const topLangs = (data.languageDistribution || []).slice(0, 6);
    this.languageChartData = {
      labels: topLangs.map((l: any) => l.language),
      datasets: [
        {
          label: 'Repositories',
          data: topLangs.map((l: any) => l.count),
          backgroundColor: colorLanguages,
          borderColor: borderLanguages,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
    this.languageChartOptions = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: mutedText, stepSize: 1 }, grid: { color: gridColor } },
        y: { ticks: { color: primaryText }, grid: { display: false } },
      },
    };
  }

  updateChartConfigs(isDark: boolean): void {
    if (!this.analyticsData) return;
    this.applyChartThemes(isDark, this.analyticsData);

    // Force chart components update
    if (this.chartDirectives) {
      this.chartDirectives.forEach((chart) => chart.update());
    }
  }

  // --- Explorer Logic ---
  getFilteredExplorerList(): any[] {
    if (!this.analyticsData || !this.analyticsData.explorer) return [];

    let list = [...this.analyticsData.explorer];

    // 1. Search Filter
    if (this.searchText.trim()) {
      const searchLower = this.searchText.toLowerCase().trim();
      list = list.filter(
        (repo) =>
          repo.name.toLowerCase().includes(searchLower) ||
          (repo.description && repo.description.toLowerCase().includes(searchLower)) ||
          (repo.language && repo.language.toLowerCase().includes(searchLower)) ||
          (repo.topics && repo.topics.some((t: string) => t.toLowerCase().includes(searchLower)))
      );
    }

    // 2. Sorting
    list.sort((a, b) => {
      let valA: any = a[this.sortKey];
      let valB: any = b[this.sortKey];

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
    this.currentPage = 1;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  // --- Theme Toggle & Logout ---
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
