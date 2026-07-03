import { Directive, OnInit, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Directive()
export abstract class AdminBaseComponent implements OnInit {
  protected themeService = inject(ThemeService);
  protected authService = inject(AuthService);
  protected router = inject(Router);
  protected toastr = inject(ToastrService);
  protected destroyRef = inject(DestroyRef);

  isSunVisible = true;
  sidebarOpened = false;
  isDesktop = window.innerWidth >= 768;

  ngOnInit(): void {
    this.isSunVisible = this.themeService.isLightMode();
    // Watch for window resize to adjust sidebar overlay state
    window.addEventListener('resize', () => {
      this.isDesktop = window.innerWidth >= 768;
    });
  }

  toggleSidebar(): void {
    this.sidebarOpened = !this.sidebarOpened;
  }

  toggleMode(): void {
    this.themeService.toggleDarkMode();
    this.isSunVisible = this.themeService.isLightMode();
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.toastr.success('Logged out successfully');
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.toastr.error('Logout failed, please try again');
      }
    });
  }
}
