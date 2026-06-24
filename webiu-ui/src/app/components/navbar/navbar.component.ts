import { Component, HostListener, OnInit, inject, PLATFORM_ID, DestroyRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { SettingsService } from '../../services/settings.service';
import { SearchService } from '../../services/search.service';
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
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  isMenuOpen = false;
  isSunVisible = true;
  currentRoute = '/';
  
  showIdeasPage = true;
  currentYear = 2026;

  get currentYearShort(): string {
    return String(this.currentYear).slice(-2);
  }

  ngOnInit(): void {
    this.isSunVisible = !this.themeService.isDarkMode();
    this.loadPublicSettings();
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        this.isMenuOpen = false;
      });
  }

  loadPublicSettings(): void {
    this.settingsService.getPublicSettings().subscribe({
      next: (res) => {
        if (res?.success && res?.settings) {
          const s = res.settings;
          this.currentYear = Number(s['gsoc.current_year']) || 2026;
          this.showIdeasPage = s['gsoc.show_ideas_page'] === true || s['gsoc.show_ideas_page'] === 'true';
        }
      },
      error: () => {
        this.showIdeasPage = true;
        this.currentYear = 2026;
      }
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

    // Handle menu closing when clicking outside (but not on the toggle button)
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
    // Close menu after navigation on mobile
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }
}
