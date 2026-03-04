import { Component, HostListener, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
  private platformId = inject(PLATFORM_ID);

  // ==================== STATE ====================
  isMenuOpen = false;
  isSunVisible = true;
  isLoggedIn = false;
  showLoginOptions = false;
  isCommunityDropdownOpen = false;          // ← NEW (dropdown control)

  user: any;
  currentRoute = '/';

  // ==================== GETTERS ====================
  get activeCommunityLabel(): string {
    return this.currentRoute === '/opportunities' ? 'Opportunities' : 'Community';
  }

  // Smart active checker (Community + Opportunities dono handle karta hai)
  isRouteActive(routes: string | string[]): boolean {
    if (typeof routes === 'string') {
      return this.currentRoute === routes;
    }
    return routes.some(route => this.currentRoute.startsWith(route));
  }

  // ==================== LIFECYCLE ====================
  ngOnInit(): void {
    this.isSunVisible = !this.themeService.isDarkMode();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentRoute = event.url;
        this.isMenuOpen = false;
        this.isCommunityDropdownOpen = false;   // ← dropdown bhi band
      });

    // Query param user handling (existing logic)
    if (isPlatformBrowser(this.platformId)) {
      const queryParams = new URLSearchParams(window.location.search);
      const user = queryParams.get('user');
      if (user) {
        try {
          this.user = JSON.parse(decodeURIComponent(user));
          this.isLoggedIn = true;
        } catch (e) {
          console.warn('Failed to parse user query param:', e);
          this.user = null;
          this.isLoggedIn = false;
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }

  // ==================== DROPDOWN METHODS ====================
  toggleCommunityDropdown(event: Event): void {
    event.stopImmediatePropagation();
    this.isCommunityDropdownOpen = !this.isCommunityDropdownOpen;
  }

  closeCommunityDropdown(): void {
    this.isCommunityDropdownOpen = false;
  }

  // ==================== EXISTING METHODS (Optimized) ====================
  toggleLoginOptions(): void {
    if (this.isLoggedIn) {
      this.logout();
    } else {
      this.showLoginOptions = !this.showLoginOptions;
    }
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

  logout(): void {
    this.isLoggedIn = false;
    this.user = null;
  }

  loginWithGoogle(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = `${environment.serverUrl}/auth/google`;
    }
  }

  loginWithGitHub(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = `${environment.serverUrl}/auth/github`;
    }
  }

  preventReload(event: Event): void {
    if (this.router.url === '/') {
      event.preventDefault();
    } else {
      this.router.navigate(['/']);
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.isMenuOpen = false;
    this.closeCommunityDropdown();          // ← dropdown bhi band
  }

  // ==================== CLICK OUTSIDE (Enhanced) ====================
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const loginOptionsElement = document.querySelector('.login-options');
    const loginButton = document.querySelector('.Login_Logout');
    const navbarMenu = document.querySelector('#navbarMenu');
    const navigationButtons = document.querySelector('.navigation__buttons');

    // Login options close
    if (
      this.showLoginOptions &&
      !loginOptionsElement?.contains(event.target as Node) &&
      !loginButton?.contains(event.target as Node)
    ) {
      this.showLoginOptions = false;
    }

    // Mobile menu close
    if (
      this.isMenuOpen &&
      navbarMenu &&
      !navbarMenu.contains(event.target as Node) &&
      !navigationButtons?.contains(event.target as Node)
    ) {
      this.isMenuOpen = false;
    }

    // 🔥 Community Dropdown close on outside click
    if (this.isCommunityDropdownOpen) {
      const dropdown = document.querySelector('.community-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        this.isCommunityDropdownOpen = false;
      }
    }
  }
}
