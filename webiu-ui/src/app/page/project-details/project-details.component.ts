import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { ProjectCacheService } from '../../services/project-cache.service';
import { Project } from '../projects/project.model';
import { ProjectBasicInfoComponent } from '../../components/project-basic-info/project-basic-info.component';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, RouterModule, ProjectBasicInfoComponent],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss'],
})
export class ProjectDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectCacheService);

  projectId: string | null = null;
  project: Project | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    if (this.projectId) {
      this.fetchProjectDetails(this.projectId);
    }
  }

  /**
   * Orchestrates the fetching of project metadata and manages view states.
   */
  fetchProjectDetails(name: string): void {
    this.loading = true;
    this.projectService.getProjectByName(name).subscribe({
      next: (project: Project) => {
        this.project = project;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load project details.';
        this.loading = false;
        console.error(err);
      },
    });
  }
}
