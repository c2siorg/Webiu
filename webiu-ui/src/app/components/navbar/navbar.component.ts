import { Component, HostListener, OnInit, inject, PLATFORM_ID, DestroyRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { SettingsService } from '../../services/settings.service';
import { SearchService } from '../../services/search.service';
import { AppConfigService } from '../../services/app-config.service';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private settingsService = inject(SettingsService);
  private searchService = inject(SearchService);
  private appConfigService = inject(AppConfigService);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  isMenuOpen = false;
  isSunVisible = true;
  currentRoute = '/';

  /** Controls GSoC page visibility (also driven by backend settings) */
  showIdeasPage = true;
  currentYear = 2026;

  /**
   * Section visibility flags — driven by config.json written during `webiu init`.
   * Home is always true (forced on). Defaults all-true so a fresh clone shows everything.
   */
  showProjects = true;
  showPublications = true;
  showContributors = true;
  showCommunity = true;
  showOpportunities = true;
  showGsoc = true;

  get currentYearShort(): string {
    return String(this.currentYear).slice(-2);
  }

  ngOnInit(): void {
    this.isSunVisible = !this.themeService.isDarkMode();

    // ── Load section visibility from CLI config.json ──────────────────────
    this.appConfigService.getConfig().subscribe({
      next: (config: import('../../services/app-config.service').AppConfig) => {
        if (config.navbarSections && config.navbarSections.length > 0) {
          const s = config.navbarSections;
          this.showProjects      = s.includes('projects');
          this.showPublications  = s.includes('publications');
          this.showContributors  = s.includes('contributors');
          this.showCommunity     = s.includes('community');
          this.showOpportunities = s.includes('opportunities');
          this.showGsoc          = s.includes('gsoc');
        }
      },
    });

    // ── Load runtime settings from backend (GSoC year, ideas page toggle) ─
    this.loadPublicSettings();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        this.isMenuOpen = false;
      });
  }

  loadPublicSettings(): void {
    this.settingsService.getPublicSettings().subscribe({
      next: (res: Record<string, any>) => {
        if (res?.['success'] && res?.['settings']) {
          const s = res['settings'];
          this.currentYear = Number(s['gsoc.current_year']) || 2026;
          // Backend can also override the GSoC section toggle
          if (s['gsoc.show_ideas_page'] !== undefined) {
            this.showIdeasPage = s['gsoc.show_ideas_page'] === true || s['gsoc.show_ideas_page'] === 'true';
          }
        }
      },
      error: () => {
        this.showIdeasPage = true;
        this.currentYear = 2026;
      },
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }

  toggleMode(): void {
    this.isSunVisible = !this.isSunVisible;
    this.toggleTheme();
  }

  triggerSearch(event: Event): void {
    event.preventDefault();
    this.searchService.open();
  }

  preventReload(event: Event): void {
    if (this.router.url === '/') {
      event.preventDefault();
    } else {
      this.router.navigate(['/']);
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const navbarMenu = document.querySelector('#navbarMenu');
    const navigationButtons = document.querySelector('.navigation__buttons');

    if (
      this.isMenuOpen &&
      navbarMenu &&
      !navbarMenu.contains(event.target as Node) &&
      !navigationButtons?.contains(event.target as Node)
    ) {
      this.isMenuOpen = false;
    }
  }

  isRouteActive(route: string): boolean {
    if (route === '/projects' && this.currentRoute.startsWith('/project')) {
      return true;
    }
    return this.currentRoute === route;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }
}
