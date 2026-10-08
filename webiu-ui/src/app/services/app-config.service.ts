import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, catchError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export interface AppConfig {
  orgName: string;
  githubOrg: string;
  orgType: string;
  themeAccent: string;
  navbarSections: string[];
  apiUrl: string;
  graphqlUrl: string;
}

const DEFAULT_CONFIG: AppConfig = {
  orgName: 'WebiU',
  githubOrg: 'c2siorg',
  orgType: 'opensource',
  themeAccent: '#7B8CFF',
  navbarSections: ['home', 'projects', 'publications', 'contributors', 'community', 'opportunities', 'gsoc'],
  apiUrl: 'http://localhost:5050',
  graphqlUrl: 'http://localhost:5050/graphql',
};

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  /** Cached observable of the runtime config.json */
  private config$: Observable<AppConfig> | null = null;

  getConfig(): Observable<AppConfig> {
    if (!this.config$) {
      this.config$ = this.http
        .get<AppConfig>('/assets/config.json')
        .pipe(
          catchError(() => of(DEFAULT_CONFIG)),
          shareReplay(1),
        );
    }
    // Non-null assertion safe here: the if-block above guarantees config$ is set
    return this.config$!;
  }

  /**
   * Apply the --theme-accent CSS custom property to the document root.
   * Called once from AppComponent after config is loaded.
   */
  applyTheme(config: AppConfig): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const accent = config.themeAccent || DEFAULT_CONFIG.themeAccent;
    const accentDim = `${accent}26`;
    const accentGlow = `0 0 24px ${accent}40`;

    const root = document.documentElement.style;
    root.setProperty('--theme-accent', accent);
    root.setProperty('--theme-accent-dim', accentDim);
    root.setProperty('--theme-accent-glow', accentGlow);

    // Dynamic runtime overrides for ALL component aliases
    root.setProperty('--accent-purple', accent);
    root.setProperty('--accent-purple-dim', accentDim);
    root.setProperty('--primary-color', accent);
    root.setProperty('--hover-color', accent);
    root.setProperty('--arrow-stroke-color', accent);
    root.setProperty('--publications-card-border-link', accent);
    root.setProperty('--profile-username-color', accent);
  }
}
