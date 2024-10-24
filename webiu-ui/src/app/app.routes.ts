import { Routes } from '@angular/router';
import { HomepageComponent } from './page/homepage/homepage.component';
import { ProjectsComponent } from './page/projects/projects.component';
import { PublicationsComponent } from './page/publications/publications.component';
import { ContributorsComponent } from './page/contributors/contributors.component';
import { CommunityComponent } from './page/community/community.component';
import { GsocComponent } from './page/gsoc/gsoc.component';
import { GsocProjectIdeaComponent } from './page/gsoc-project-idea/gsoc-project-idea.component';
import { ContributorDetailsComponent } from './page/contributor-details/contributor-details.component';


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
  { path: 'idea', component: GsocProjectIdeaComponent },
  { path: 'contributors/:contributorLogin/details', component: ContributorDetailsComponent },
];
