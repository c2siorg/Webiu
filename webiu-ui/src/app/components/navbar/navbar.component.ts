import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

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

  constructor(private router: Router, private themeService: ThemeService) {
    this.isSunVisible = !this.themeService.isDarkMode();
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
    
    window.location.href = 'http://localhost:6000/auth/google';
  }

  loginWithGitHub(): void {
    
    window.location.href = 'http://localhost:6000/auth/github';
  }
   // Close login options if clicked outside
   @HostListener('document:click', ['$event'])
   onClickOutside(event: MouseEvent): void {
     const loginOptionsElement = document.querySelector('.login-options');
     const loginButton = document.querySelector('.Login_Logout');
     
     // If the click is outside of the login options or login button, close the login options
     if (this.showLoginOptions && !loginOptionsElement?.contains(event.target as Node) && !loginButton?.contains(event.target as Node)) {
       this.showLoginOptions = false;
     }
   }
   
}

