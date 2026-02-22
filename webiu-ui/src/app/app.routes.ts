import { Routes, RouterModule } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./page/homepage/homepage.component').then(
        (m) => m.HomepageComponent,
      ),
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
