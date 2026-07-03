import { Component, OnInit, inject, ViewChildren, QueryList } from '@angular/core';
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
export class AdminRepositoriesComponent extends AdminBaseComponent implements OnInit {
  private settingsService = inject(SettingsService);

  @ViewChildren(BaseChartDirective) chartDirectives?: QueryList<BaseChartDirective>;

  analyticsData: any = null;
  isLoading = true;
  hasError = false;

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

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadAnalyticsData();
  }

  loadAnalyticsData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.settingsService.getRepositoryAnalytics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    const primaryText = isDark ? '#f8fafc' : '#0f172a';
    const mutedText = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

    // Colors
    const coralBg = isDark ? 'rgba(244, 63, 94, 0.65)' : 'rgba(225, 29, 72, 0.65)';
    const coralBorder = isDark ? '#f43f5e' : '#e11d48';

    const purpleBg = isDark ? 'rgba(168, 85, 247, 0.65)' : 'rgba(124, 58, 237, 0.65)';
    const purpleBorder = isDark ? '#a855f7' : '#7c3aed';

    const limeBg = isDark ? 'rgba(132, 204, 22, 0.65)' : 'rgba(101, 163, 13, 0.65)';
    const limeBorder = isDark ? '#84cc16' : '#65a30d';

    // 1. Popularity Horizontal Chart (Stars)
    const popLabels = (data.popularity || []).map((r: any) => r.name);
    const popStars = (data.popularity || []).map((r: any) => r.stars);

    this.popularityChartData = {
      labels: popLabels,
      datasets: [
        {
          label: 'Stars',
          data: popStars,
          backgroundColor: coralBg,
          borderColor: coralBorder,
          borderWidth: 1.5,
          borderRadius: 4,
        },
      ],
    };

    this.popularityChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: mutedText, font: { family: 'Geist', size: 11 } },
        },
        y: {
          grid: { display: false },
          ticks: { color: primaryText, font: { family: 'Geist', size: 11 } },
        },
      },
    };

    // 2. Contributor Distribution (Horizontal)
    const contribLabels = (data.contributorDistribution || []).map((r: any) => r.name);
    const contribCounts = (data.contributorDistribution || []).map((r: any) => r.contributorCount);

    this.contributorChartData = {
      labels: contribLabels,
      datasets: [
        {
          label: 'Contributors',
          data: contribCounts,
          backgroundColor: purpleBg,
          borderColor: purpleBorder,
          borderWidth: 1.5,
          borderRadius: 4,
        },
      ],
    };

    this.contributorChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: mutedText, font: { family: 'Geist', size: 11 } },
        },
        y: {
          grid: { display: false },
          ticks: { color: primaryText, font: { family: 'Geist', size: 11 } },
        },
      },
    };

    // 3. Fork Distribution (Vertical)
    const forkLabels = (data.forkDistribution || []).map((r: any) => r.name);
    const forkCounts = (data.forkDistribution || []).map((r: any) => r.forks);

    this.forkChartData = {
      labels: forkLabels,
      datasets: [
        {
          label: 'Forks',
          data: forkCounts,
          backgroundColor: limeBg,
          borderColor: limeBorder,
          borderWidth: 1.5,
          borderRadius: 4,
        },
      ],
    };

    this.forkChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: primaryText, font: { family: 'Geist', size: 11 } },
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: mutedText, font: { family: 'Geist', size: 11 } },
        },
      },
    };

    // 4. Topic Distribution (Doughnut)
    const topicKeys = Object.keys(data.topicsDistribution || {});
    const topicVals = Object.values(data.topicsDistribution || {}) as number[];

    this.topicChartData = {
      labels: topicKeys,
      datasets: [
        {
          data: topicVals,
          backgroundColor: [
            '#f43f5e',
            '#a855f7',
            '#84cc16',
            '#06b6d4',
            '#eab308',
            '#ec4899',
            '#3b82f6',
          ],
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
          labels: { color: primaryText, font: { family: 'Geist', size: 11 } },
        },
      },
    };

    // 5. Visibility Distribution (Pie)
    const visKeys = Object.keys(data.visibilityDistribution || {});
    const visVals = Object.values(data.visibilityDistribution || {}) as number[];

    this.visibilityChartData = {
      labels: visKeys,
      datasets: [
        {
          data: visVals,
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 0,
        },
      ],
    };

    this.visibilityChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: primaryText, font: { family: 'Geist', size: 12 } },
        },
      },
    };

    // 6. Language Distribution (Horizontal)
    const langLabels = (data.languagesDistribution || []).map((l: any) => l.language);
    const langScores = (data.languagesDistribution || []).map((l: any) => l.repoCount);

    this.languageChartData = {
      labels: langLabels,
      datasets: [
        {
          label: 'Repositories',
          data: langScores,
          backgroundColor: 'rgba(6, 182, 212, 0.65)',
          borderColor: '#06b6d4',
          borderWidth: 1.5,
          borderRadius: 4,
        },
      ],
    };

    this.languageChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: mutedText, font: { family: 'Geist', size: 11 } },
        },
        y: {
          grid: { display: false },
          ticks: { color: primaryText, font: { family: 'Geist', size: 11 } },
        },
      },
    };
  }

  // --- Repo Explorer logic ---

  get filteredRepositories(): any[] {
    if (!this.analyticsData?.explorer) return [];

    const search = this.searchText.toLowerCase().trim();
    const list = this.analyticsData.explorer.filter((r: any) => {
      return (
        (r.name || '').toLowerCase().includes(search) ||
        (r.language || '').toLowerCase().includes(search)
      );
    });

    // Sorting
    list.sort((a: any, b: any) => {
      let valA = a[this.sortKey];
      let valB = b[this.sortKey];

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

  getTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRepositories.length / this.pageSize));
  }

  get paginatedRepositories(): any[] {
    const list = this.filteredRepositories;
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

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  private updateChartConfigs(isDark: boolean): void {
    if (!this.analyticsData) return;

    const primaryText = isDark ? '#f8fafc' : '#0f172a';
    const mutedText = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

    const coralBg = isDark ? 'rgba(244, 63, 94, 0.65)' : 'rgba(225, 29, 72, 0.65)';
    const purpleBg = isDark ? 'rgba(168, 85, 247, 0.65)' : 'rgba(124, 58, 237, 0.65)';
    const limeBg = isDark ? 'rgba(132, 204, 22, 0.65)' : 'rgba(101, 163, 13, 0.65)';

    // Update horizontal star chart
    if (this.popularityChartOptions?.scales?.['x']) {
      this.popularityChartOptions.scales['x'].grid = { color: gridColor };
      this.popularityChartOptions.scales['x'].ticks = { color: mutedText, font: { family: 'Geist', size: 11 } };
    }
    if (this.popularityChartOptions?.scales?.['y']) {
      this.popularityChartOptions.scales['y'].ticks = { color: primaryText, font: { family: 'Geist', size: 11 } };
    }
    if (this.popularityChartData?.datasets?.[0]) {
      this.popularityChartData.datasets[0].backgroundColor = coralBg;
    }

    // Update contributor chart
    if (this.contributorChartOptions?.scales?.['x']) {
      this.contributorChartOptions.scales['x'].grid = { color: gridColor };
      this.contributorChartOptions.scales['x'].ticks = { color: mutedText, font: { family: 'Geist', size: 11 } };
    }
    if (this.contributorChartOptions?.scales?.['y']) {
      this.contributorChartOptions.scales['y'].ticks = { color: primaryText, font: { family: 'Geist', size: 11 } };
    }
    if (this.contributorChartData?.datasets?.[0]) {
      this.contributorChartData.datasets[0].backgroundColor = purpleBg;
    }

    // Update fork chart
    if (this.forkChartOptions?.scales?.['x']) {
      this.forkChartOptions.scales['x'].ticks = { color: primaryText, font: { family: 'Geist', size: 11 } };
    }
    if (this.forkChartOptions?.scales?.['y']) {
      this.forkChartOptions.scales['y'].grid = { color: gridColor };
      this.forkChartOptions.scales['y'].ticks = { color: mutedText, font: { family: 'Geist', size: 11 } };
    }
    if (this.forkChartData?.datasets?.[0]) {
      this.forkChartData.datasets[0].backgroundColor = limeBg;
    }

    // Update doughnut chart
    if (this.topicChartOptions?.plugins?.legend?.labels) {
      this.topicChartOptions.plugins.legend.labels.color = primaryText;
    }

    // Update pie chart
    if (this.visibilityChartOptions?.plugins?.legend?.labels) {
      this.visibilityChartOptions.plugins.legend.labels.color = primaryText;
    }

    // Update language chart
    if (this.languageChartOptions?.scales?.['x']) {
      this.languageChartOptions.scales['x'].grid = { color: gridColor };
      this.languageChartOptions.scales['x'].ticks = { color: mutedText, font: { family: 'Geist', size: 11 } };
    }
    if (this.languageChartOptions?.scales?.['y']) {
      this.languageChartOptions.scales['y'].ticks = { color: primaryText, font: { family: 'Geist', size: 11 } };
    }
    if (this.languageChartData?.datasets?.[0]) {
      this.languageChartData.datasets[0].backgroundColor = isDark ? 'rgba(6, 182, 212, 0.65)' : 'rgba(0, 172, 193, 0.65)';
    }

    // Force update chart directives
    if (this.chartDirectives) {
      this.chartDirectives.forEach((chart) => chart.update());
    }
  }

  getFilteredExplorerList(): any[] {
    return this.filteredRepositories;
  }

  getPaginatedExplorerList(): any[] {
    return this.paginatedRepositories;
  }

  setSort(key: string): void {
    this.onSort(key);
  }

  override toggleMode(): void {
    super.toggleMode();
    this.updateChartConfigs(this.themeService.isDarkMode());
  }
}
