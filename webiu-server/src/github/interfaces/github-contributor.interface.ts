import { GithubUser } from './github-user.interface';

export interface GithubContributor extends GithubUser {
  contributions: number;
}
