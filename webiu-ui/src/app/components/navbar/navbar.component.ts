import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  isMenuOpen = false;
  isSunVisible = true;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  constructor(private themeService: ThemeService) {
    this.isSunVisible = !this.themeService.isDarkMode();
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }

  toggleMode() {
    this.isSunVisible = !this.isSunVisible;
    this.toggleTheme();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
