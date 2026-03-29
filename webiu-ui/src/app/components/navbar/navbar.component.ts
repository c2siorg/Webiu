import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService, AuthUser } from '../../services/auth.service';

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
  private authService = inject(AuthService);
  private subscriptions = new Subscription();

  isMenuOpen = false;
  isSunVisible = true;
  isLoggedIn = false;
  isAdmin = false;
  showLoginOptions = false;
  user: AuthUser | null = null;
  currentRoute = '/';

  ngOnInit(): void {
    this.isSunVisible = !this.themeService.isDarkMode();
    this.subscriptions.add(
      this.router.events
        .pipe(
          filter(
            (event): event is NavigationEnd => event instanceof NavigationEnd,
          ),
        )
        .subscribe((event: NavigationEnd) => {
          this.currentRoute = event.url;
          this.isMenuOpen = false;
          this.showLoginOptions = false;
        }),
    );

    this.subscriptions.add(
      this.authService.authSession$.subscribe((session) => {
        this.user = session?.user ?? null;
        this.isLoggedIn = !!session;
        this.isAdmin = this.authService.isAdmin;
      }),
    );

    if (isPlatformBrowser(this.platformId)) {
      const didConsumeOAuthQuery = this.authService.consumeOAuthUserFromUrl(
        window.location.search,
      );
      if (didConsumeOAuthQuery) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
    this.authService.logout();
    this.showLoginOptions = false;
  }

  navigateToLogin(): void {
    this.showLoginOptions = false;
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.showLoginOptions = false;
    this.router.navigate(['/register']);
  }

  navigateToAdmin(): void {
    this.router.navigate(['/admin']);
    this.closeMenu();
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
    return this.currentRoute.split('?')[0] === route;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    // Close menu after navigation on mobile
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }
}
