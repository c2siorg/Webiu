import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { BackToTopComponent } from './components/back-to-top/back-to-top.component';
import { SettingsService } from './services/settings.service';
import { AppConfigService } from './services/app-config.service';
import { Title, Meta } from '@angular/platform-browser';
import { SpotlightSearchComponent } from './components/spotlight-search/spotlight-search.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    BackToTopComponent,
    SpotlightSearchComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'webiu';
  private router = inject(Router);
  private settingsService = inject(SettingsService);
  private appConfigService = inject(AppConfigService);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  isMaintenanceMode = false;

  ngOnInit(): void {
    // ── Step 1: Load CLI-written config.json first (works even offline) ──────
    // This applies the org name, theme accent color, and navbar sections
    // immediately — before the backend is even contacted.
    this.appConfigService.getConfig().subscribe({
      next: (config: import('./services/app-config.service').AppConfig) => {
        // Apply the CLI-chosen theme accent color as a CSS custom property
        this.appConfigService.applyTheme(config);

        // Set the page title from CLI org name as a fast offline fallback.
        // This will be overridden if the backend responds with site.title.
        if (config.orgName && config.orgName !== 'WebiU') {
          this.titleService.setTitle(`${config.orgName} — Community Portal`);
        }
      },
    });

    // ── Step 2: Also load settings from the backend API (when DB is running) ─
    // Backend settings (site.title, site.description, site.maintenance_mode)
    // take precedence over the static config.json values if the backend is up.
    this.settingsService.getPublicSettings().subscribe({
      next: (res: Record<string, any>) => {
        if (res?.['success'] && res?.['settings']) {
          const s = res['settings'];
          this.isMaintenanceMode = s['site.maintenance_mode'] === true || s['site.maintenance_mode'] === 'true';

          const newTitle = s['site.title'] || undefined;
          if (newTitle) {
            this.titleService.setTitle(newTitle);
          }
          if (s['site.description']) {
            this.metaService.updateTag({ name: 'description', content: String(s['site.description']) });
          }
          // Apply backend-stored theme accent if it differs from config.json
          if (s['site.theme_accent']) {
            this.appConfigService.applyTheme({ themeAccent: s['site.theme_accent'] } as any);
          }
        }
      },
      error: () => {
        // Backend offline — config.json values already applied above, nothing to do.
        this.isMaintenanceMode = false;
      }
    });
  }

  get showLayout(): boolean {
    return !this.isAdminRoute;
  }

  get isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }
}
