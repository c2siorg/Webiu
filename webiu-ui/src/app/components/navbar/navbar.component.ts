import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  isMenuOpen = false;
  isSunVisible = true;
  isLoggedIn = false;
  showLoginOptions = false;
  user: any;
  currentRoute: string = '/';

  constructor(private router: Router, private themeService: ThemeService) {
    this.isSunVisible = !this.themeService.isDarkMode();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
  }

  ngOnInit(): void {
    const queryParams = new URLSearchParams(window.location.search);
    const user = queryParams.get('user');
    if (user) {
      this.user = JSON.parse(decodeURIComponent(user));
      this.isLoggedIn = true;
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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
    console.log('Logged out');
  }

  loginWithGoogle(): void {
    window.location.href = 'http://localhost:5001/auth/google';
  }

  loginWithGitHub(): void {
    window.location.href = 'http://localhost:5001/auth/github';
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
    const loginOptionsElement = document.querySelector('.login-options');
    const loginButton = document.querySelector('.Login_Logout');
    
    if (this.showLoginOptions && !loginOptionsElement?.contains(event.target as Node) && !loginButton?.contains(event.target as Node)) {
      this.showLoginOptions = false;
    }
  }

  isRouteActive(route: string): boolean {
    return this.currentRoute === route;
  }
}

