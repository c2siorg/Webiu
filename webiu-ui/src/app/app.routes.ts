import { Routes } from '@angular/router';
import { adminAuthGuard } from './common/guards/admin-auth.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'WebiU — Open Source Intelligence Platform',
    loadComponent: () =>
      import('./page/homepage/homepage.component').then(
        (m) => m.HomepageComponent,
      ),
  },
  {
    path: 'projects',
    title: 'Projects | WebiU',
    loadComponent: () =>
      import('./page/projects/projects.component').then(
        (m) => m.ProjectsComponent,
      ),
  },
  {
    path: 'publications',
    title: 'Publications | WebiU',
    loadComponent: () =>
      import('./page/publications/publications.component').then(
        (m) => m.PublicationsComponent,
      ),
  },
  {
    path: 'contributors',
    title: 'Contributors | WebiU',
    loadComponent: () =>
      import('./page/contributors/contributors.component').then(
        (m) => m.ContributorsComponent,
      ),
  },
  {
    path: 'community',
    title: 'Community | WebiU',
    loadComponent: () =>
      import('./page/community/community.component').then(
        (m) => m.CommunityComponent,
      ),
  },
  {
    path: 'gsoc',
    title: 'GSoC Project Ideas | WebiU',
    loadComponent: () =>
      import('./page/gsoc/gsoc.component').then((m) => m.GsocComponent),
  },
  {
    path: 'gsoc/2024',
    title: 'GSoC 2024 Archive | WebiU',
    loadComponent: () =>
      import('./page/gsoc2024/gsoc2024.component').then(
        (m) => m.Gsoc2024Component,
      ),
  },
  {
    path: 'opportunities',
    title: 'Opportunities | WebiU',
    loadComponent: () =>
      import('./page/opportunities/opportunities.component').then(
        (m) => m.OpportunitiesComponent,
      ),
  },
  {
    path: 'project/:id',
    title: 'Project Details | WebiU',
    loadComponent: () =>
      import('./page/project-details/project-details.component').then(
        (m) => m.ProjectDetailsComponent,
      ),
  },
  {
    path: 'search',
    title: 'Advanced Search | WebiU',
    loadComponent: () =>
      import('./page/contributor-search/contributor-search.component').then(
        (m) => m.ContributorSearchComponent,
      ),
  },
  {
    path: 'admin',
    title: 'Admin Access | WebiU',
    loadComponent: () =>
      import('./page/admin/admin.component').then((m) => m.AdminComponent),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./page/admin/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
      ),
    canActivate: [adminAuthGuard],
    children: [
      {
        path: 'dashboard',
        title: 'Admin Dashboard | WebiU',
        loadComponent: () =>
          import('./page/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'contributors',
        title: 'Contributor Intelligence | WebiU',
        loadComponent: () =>
          import('./page/admin-contributors/admin-contributors.component').then(
            (m) => m.AdminContributorsComponent,
          ),
      },
      {
        path: 'opportunities',
        title: 'Admin Opportunities | WebiU',
        loadComponent: () =>
          import('./page/admin-opportunities/admin-opportunities.component').then(
            (m) => m.AdminOpportunitiesComponent,
          ),
      },
      {
        path: 'repositories',
        title: 'Repository Intelligence | WebiU',
        loadComponent: () =>
          import('./page/admin-repositories/admin-repositories.component').then(
            (m) => m.AdminRepositoriesComponent,
          ),
      },
      {
        path: 'settings',
        title: 'Admin Settings | WebiU',
        loadComponent: () =>
          import('./page/admin-settings/admin-settings.component').then(
            (m) => m.AdminSettingsComponent,
          ),
      },
      {
        path: 'ideas',
        title: 'Admin GSoC Management | WebiU',
        loadComponent: () =>
          import('./page/admin-ideas/admin-ideas.component').then(
            (m) => m.AdminIdeasComponent,
          ),
      },
      {
        path: 'profile',
        title: 'Admin Profile | WebiU',
        loadComponent: () =>
          import('./page/admin-profile/admin-profile.component').then(
            (m) => m.AdminProfileComponent,
          ),
      },
      {
        path: 'audit',
        title: 'Admin Audit Logs | WebiU',
        loadComponent: () =>
          import('./page/admin-audit/admin-audit.component').then(
            (m) => m.AdminAuditComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    title: 'Page Not Found | WebiU',
    loadComponent: () =>
      import('./page/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
