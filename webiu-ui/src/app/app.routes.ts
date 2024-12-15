import { Routes, RouterModule } from '@angular/router';
import { HomepageComponent } from './page/homepage/homepage.component';
import { ProjectsComponent } from './page/projects/projects.component';
import { PublicationsComponent } from './page/publications/publications.component';
import { ContributorsComponent } from './page/contributors/contributors.component';
import { CommunityComponent } from './page/community/community.component';
import { GsocComponent } from './page/gsoc/gsoc.component';
import { GsocProjectIdeaComponent } from './page/gsoc-project-idea/gsoc-project-idea.component';
import { ContributorSearchComponent } from './page/contributor-search/contributor-search.component';
import { LoginComponent } from './page/login/login.component';
import { RegisterComponent } from './page/register/register.component';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
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
  { path: 'search', component: ContributorSearchComponent },
];
export const AppRoutingModule = RouterModule.forRoot(routes);
