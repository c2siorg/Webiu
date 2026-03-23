import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { UserRole } from './services/auth.service';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./page/homepage/homepage.component').then(
        (m) => m.HomepageComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./page/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./page/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.ADMIN] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./page/admin/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'overview',
        loadComponent: () =>
          import('./page/admin/admin-overview/admin-overview.component').then(
            (m) => m.AdminOverviewComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./page/admin/admin-users/admin-users.component').then(
            (m) => m.AdminUsersComponent,
          ),
      },
      {
        path: 'content',
        loadComponent: () =>
          import('./page/admin/admin-content/admin-content.component').then(
            (m) => m.AdminContentComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./page/admin/admin-settings/admin-settings.component').then(
            (m) => m.AdminSettingsComponent,
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./page/admin/admin-analytics/admin-analytics.component').then(
            (m) => m.AdminAnalyticsComponent,
          ),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./page/projects/projects.component').then(
        (m) => m.ProjectsComponent,
      ),
  },
  {
    path: 'publications',
    loadComponent: () =>
      import('./page/publications/publications.component').then(
        (m) => m.PublicationsComponent,
      ),
  },
  {
    path: 'contributors',
    loadComponent: () =>
      import('./page/contributors/contributors.component').then(
        (m) => m.ContributorsComponent,
      ),
  },
  {
    path: 'community',
    loadComponent: () =>
      import('./page/community/community.component').then(
        (m) => m.CommunityComponent,
      ),
  },
  {
    path: 'gsoc',
    loadComponent: () =>
      import('./page/gsoc/gsoc.component').then((m) => m.GsocComponent),
  },
  {
    path: 'gsoc/2024',
    loadComponent: () =>
      import('./page/gsoc2024/gsoc2024.component').then(
        (m) => m.Gsoc2024Component,
      ),
  },
  {
    path: 'opportunities',
    loadComponent: () =>
      import('./page/opportunities/opportunities.component').then(
        (m) => m.OpportunitiesComponent,
      ),
  },
  {
    path: 'idea',
    loadComponent: () =>
      import('./page/gsoc-project-idea/gsoc-project-idea.component').then(
        (m) => m.GsocProjectIdeaComponent,
      ),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./page/contributor-search/contributor-search.component').then(
        (m) => m.ContributorSearchComponent,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./page/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];

export const AppRoutingModule = RouterModule.forRoot(routes, {
  scrollPositionRestoration: 'enabled',
  anchorScrolling: 'enabled',
});
