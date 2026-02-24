import { Component, Input, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ProjectCacheService } from '../../services/project-cache.service';
import { CommitGraphComponent } from '../commit-graph/commit-graph.component';

@Component({
  selector: 'app-project-insights',
  standalone: true,
  imports: [CommonModule, CommitGraphComponent],
  templateUrl: './project-insights.component.html',
  styleUrls: ['./project-insights.component.scss'],
})
export class ProjectInsightsComponent implements OnInit {
  @Input() projectName = '';

  private projectService = inject(ProjectCacheService);
  private destroyRef = inject(DestroyRef);

  insights: any = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    if (this.projectName) {
      this.fetchInsights();
    }
  }

  private fetchInsights(): void {
    this.loading = true;
    this.projectService
      .getProjectInsights(this.projectName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.insights = data;
          this.loading = false;
        },
        error: () => {
          this.error = 'Unable to load project insights.';
          this.loading = false;
        },
      });
  }
}
