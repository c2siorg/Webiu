import { Component, Input, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ProjectCacheService } from '../../services/project-cache.service';
import { Contributor } from '../../page/projects/project.model';

type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-project-contributors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-contributors.component.html',
  styleUrls: ['./project-contributors.component.scss'],
})
export class ProjectContributorsComponent implements OnInit {
  @Input() projectName = '';

  private projectService = inject(ProjectCacheService);
  private destroyRef = inject(DestroyRef);

  contributors: Contributor[] = [];
  loading = true;
  error: string | null = null;

  viewMode: ViewMode = 'grid';
  searchTerm = '';
  showAllGrid = false;

  totalContributions = 0;
  topContributorShare = 0;

  get filteredContributors(): Contributor[] {
    if (!this.searchTerm) return this.contributors;
    const term = this.searchTerm.toLowerCase();
    return this.contributors.filter((c) =>
      c.login.toLowerCase().includes(term),
    );
  }

  ngOnInit(): void {
    if (this.projectName) {
      this.fetchContributors();
    }
  }

  private get repoBase(): string {
    return `https://github.com/c2siorg/${this.projectName}`;
  }

  getCommitsUrl(username: string): string {
    return `${this.repoBase}/commits?author=${encodeURIComponent(username)}`;
  }

  getMergedPrsUrl(username: string): string {
    return `${this.repoBase}/pulls?q=is%3Apr+is%3Amerged+author%3A${encodeURIComponent(username)}`;
  }

  getClosedPrsUrl(username: string): string {
    return `${this.repoBase}/pulls?q=is%3Apr+is%3Aclosed+is%3Aunmerged+author%3A${encodeURIComponent(username)}`;
  }

  getOpenPrsUrl(username: string): string {
    return `${this.repoBase}/pulls?q=is%3Apr+is%3Aopen+author%3A${encodeURIComponent(username)}`;
  }

  getIssuesUrl(username: string): string {
    return `${this.repoBase}/issues?q=is%3Aissue+author%3A${encodeURIComponent(username)}`;
  }

  getProfileUrl(username: string): string {
    return `${this.repoBase}/pulls?q=author%3A${encodeURIComponent(username)}`;
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
    this.searchTerm = '';
  }

  private fetchContributors(): void {
    this.loading = true;
    this.projectService
      .getProjectContributors(this.projectName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.contributors = data;
          this.calculateSignals();
          this.loading = false;
        },
        error: () => {
          this.error = 'Unable to load contributors.';
          this.loading = false;
        },
      });
  }

  private calculateSignals(): void {
    if (!this.contributors.length) return;

    this.totalContributions = this.contributors.reduce(
      (acc, c) => acc + c.contributions,
      0,
    );

    if (this.totalContributions > 0) {
      const maxContributions = Math.max(
        ...this.contributors.map((c) => c.contributions),
      );
      this.topContributorShare = Math.round(
        (maxContributions / this.totalContributions) * 100,
      );
    }
  }
}