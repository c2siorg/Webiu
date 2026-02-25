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

  isMenuOpen = false;
  isSunVisible = true;
  isLoggedIn = false;
  showLoginOptions = false;
  isCommunityDropdownOpen = false;
  user: any;
  currentRoute = '/';

  ngOnInit(): void {
    this.isSunVisible = !this.themeService.isDarkMode();
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        this.isMenuOpen = false;
        this.isCommunityDropdownOpen = false;
      });

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

  toggleLoginOptions(): void {
    if (this.isLoggedIn) {
      this.logout();
    } else {
      this.showLoginOptions = !this.showLoginOptions;
      if (this.showLoginOptions) {
        this.isCommunityDropdownOpen = false;
      }
    }
  }

  toggleCommunityDropdown(): void {
    this.isCommunityDropdownOpen = !this.isCommunityDropdownOpen;
    if (this.isCommunityDropdownOpen) {
      this.showLoginOptions = false;
    }
  }

  closeCommunityDropdown(): void {
    this.isCommunityDropdownOpen = false;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (!this.isMenuOpen) {
      this.isCommunityDropdownOpen = false;
    }
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    this.isCommunityDropdownOpen = false;
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

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const loginOptionsElement = document.querySelector('.login-options');
    const loginButton = document.querySelector('.Login_Logout');
    const navbarMenu = document.querySelector('#navbarMenu');
    const navigationButtons = document.querySelector('.navigation__buttons');
    const communityDropdown = document.querySelector('.community-dropdown');
    const communityButton = document.querySelector('.community-toggle');

    // Handle login options closing
    if (
      this.showLoginOptions &&
      !loginOptionsElement?.contains(event.target as Node) &&
      !loginButton?.contains(event.target as Node)
    ) {
      this.showLoginOptions = false;
    }

    // Handle community dropdown closing
    if (
      this.isCommunityDropdownOpen &&
      !communityDropdown?.contains(event.target as Node) &&
      !communityButton?.contains(event.target as Node)
    ) {
      this.isCommunityDropdownOpen = false;
    }

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
    if (route === '/community' && (this.currentRoute === '/community' || this.currentRoute === '/opportunities')) {
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
