import { Component, Input, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ProjectCacheService } from '../../services/project-cache.service';
import { Contributor } from '../../page/projects/project.model';

@Component({
  selector: 'app-project-contributors',
  standalone: true,
  imports: [CommonModule],
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

  // Community Signals
  totalContributions = 0;
  topContributorShare = 0;
  recentContributorsCount = 0;

  ngOnInit(): void {
    if (this.projectName) {
      this.fetchContributors();
    }
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
      this.topContributorShare = Math.round(
        (this.contributors[0].contributions / this.totalContributions) * 100,
      );
    }

    // In a real scenario, we'd filters by date if available in API. 
    // For now, we'll treat all as "active" for community size.
    this.recentContributorsCount = this.contributors.length;
  }
}
