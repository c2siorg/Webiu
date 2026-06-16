import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { BackToTopComponent } from './components/back-to-top/back-to-top.component';
import { SettingsService } from './services/settings.service';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    BackToTopComponent,
    RouterModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'webiu';
  private router = inject(Router);
  private settingsService = inject(SettingsService);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  isMaintenanceMode = false;

  ngOnInit(): void {
    this.settingsService.getPublicSettings().subscribe({
      next: (res) => {
        if (res?.success && res?.settings) {
          const s = res.settings;
          this.isMaintenanceMode = s['site.maintenance_mode'] === true || s['site.maintenance_mode'] === 'true';
          const newTitle = s['site.title'] || 'WebiU';
          this.titleService.setTitle(newTitle);
          if (s['site.description']) {
            this.metaService.updateTag({ name: 'description', content: String(s['site.description']) });
          }
        }
      },
      error: () => {
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
