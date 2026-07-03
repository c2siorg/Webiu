import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly DARK_MODE_KEY = 'dark-mode';
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Default to dark mode. Only use light if user explicitly chose it.
      const storedPref = localStorage.getItem(this.DARK_MODE_KEY);
      const isLight = storedPref === 'false';
      if (!isLight) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }
  }

  toggleDarkMode(): void {
    if (isPlatformBrowser(this.platformId)) {
      const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDarkMode) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem(this.DARK_MODE_KEY, 'false');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem(this.DARK_MODE_KEY, 'true');
      }
    }
  }

  isDarkMode(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return document.documentElement.getAttribute('data-theme') === 'dark';
    }
    return true;
  }

  isLightMode(): boolean {
    return !this.isDarkMode();
  }

}