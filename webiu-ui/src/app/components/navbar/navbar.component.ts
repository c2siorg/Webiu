import { Component, HostListener, OnInit, inject, PLATFORM_ID, DestroyRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
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
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  isMenuOpen = false;
  isSunVisible = true;
  isCommunityDropdownOpen = false;
  currentRoute = '/';

  ngOnInit(): void {
    this.isSunVisible = !this.themeService.isDarkMode();
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
        this.isCommunityDropdownOpen = false;
      });
  }

  toggleCommunityDropdown(): void {
    this.isCommunityDropdownOpen = !this.isCommunityDropdownOpen;
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
    const communityDropdown = document.querySelector('.community-dropdown');
    const communityButton = document.querySelector('.community-toggle');

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

  getCommunityDropdownLabel(): string {
    return this.currentRoute === '/opportunities'
      ? 'Opportunities'
      : 'Community';
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    // Close menu after navigation on mobile
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }
}
