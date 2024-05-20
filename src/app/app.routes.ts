import { Routes } from '@angular/router';
import { HomepageComponent } from './page/homepage/homepage.component';
import { ProjectsComponent } from './page/projects/projects.component';
import { PublicationsComponent } from './page/publications/publications.component';
import { ContributorsComponent } from './page/contributors/contributors.component';
import { CommunityComponent } from './page/community/community.component';
import { GsocComponent } from './page/gsoc/gsoc.component';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  {
    path: 'projects',
    component: ProjectsComponent,
  },
  {
    path: 'publications',
    component: PublicationsComponent,
  },
  {
    path: 'contributors',
    component: ContributorsComponent,
  },
  {
    path: 'community',
    component: CommunityComponent,
  },
  { path: 'gsoc', component: GsocComponent },
];
