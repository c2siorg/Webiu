import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ProjectCacheService } from '../../services/project-cache.service';
import { Project } from '../projects/project.model';
import { ProjectBasicInfoComponent } from '../../components/project-basic-info/project-basic-info.component';
import { ProjectInsightsComponent } from '../../components/project-insights/project-insights.component';
import { ProjectContributorsComponent } from '../../components/project-contributors/project-contributors.component';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ProjectBasicInfoComponent,
    ProjectInsightsComponent,
    ProjectContributorsComponent,
  ],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss'],
})
export class ProjectDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectCacheService);
  private destroyRef = inject(DestroyRef);

  projectName: string | null = null;
  project: Project | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.projectName = this.route.snapshot.paramMap.get('id');
    if (this.projectName) {
      this.fetchProjectDetails(this.projectName);
    }
  }

  fetchProjectDetails(name: string): void {
    this.loading = true;
    this.error = null;
    this.projectService
      .getProjectByName(name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (project: Project) => {
          this.project = project;
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load project details.';
          this.loading = false;
        },
      });
  }
}
