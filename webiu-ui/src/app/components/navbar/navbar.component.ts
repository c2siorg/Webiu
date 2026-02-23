import { Component, HostListener, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ThemeService } from '../../services/theme.service';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClient],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);

  isMenuOpen = false;
  isSunVisible = true;
  isLoggedIn = false;
  showLoginOptions = false;
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
      });

    if (isPlatformBrowser(this.platformId)) {
      this.checkAuthStatus();
    }
  }

  private checkAuthStatus(): void {
    this.http.get<any>(`${environment.serverUrl}/auth/me`).subscribe({
      next: (user) => {
        this.user = user;
        this.isLoggedIn = true;
        if (window.location.search.includes('user=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      },
      error: () => {
        this.user = null;
        this.isLoggedIn = false;
      },
    });
  }

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
    this.http.get(`${environment.serverUrl}/auth/logout`).subscribe({
      next: () => {
        this.isLoggedIn = false;
        this.user = null;
      },
      error: () => {
        this.isLoggedIn = false;
        this.user = null;
      },
    });
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

    // Handle login options closing
    if (
      this.showLoginOptions &&
      !loginOptionsElement?.contains(event.target as Node) &&
      !loginButton?.contains(event.target as Node)
    ) {
      this.showLoginOptions = false;
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
