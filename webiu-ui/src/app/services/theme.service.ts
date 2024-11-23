import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly DARK_MODE_KEY = 'dark-mode';

  constructor() {
    const isDarkMode = localStorage.getItem(this.DARK_MODE_KEY) === 'true';
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }
  
  toggleDarkMode(): void {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDarkMode) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(this.DARK_MODE_KEY, 'false');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem(this.DARK_MODE_KEY, 'true');
    }
  }
  
  isDarkMode(): boolean {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }
  
}