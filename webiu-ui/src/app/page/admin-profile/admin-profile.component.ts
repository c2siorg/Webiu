import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.scss'],
})
export class AdminProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  username = '';
  role = 'Administrator';
  createdAt: Date | null = null;
  lastLoginAt: Date | null = null;

  newUsername = '';
  currentPasswordForUser = '';
  newPassword = '';
  confirmPassword = '';

  isLoading = true;
  isSavingUsername = false;
  isSavingPassword = false;
  isSunVisible = true;

  ngOnInit(): void {
    this.isSunVisible = !this.themeService.isDarkMode();
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.profileService.getProfile().subscribe({
      next: (res) => {
        this.username = res.username;
        this.newUsername = res.username;
        this.role = res.role || 'administrator';
        this.createdAt = res.createdAt ? new Date(res.createdAt) : null;
        this.lastLoginAt = res.lastLoginAt ? new Date(res.lastLoginAt) : null;
        this.isLoading = false;
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Failed to load profile information.';
        this.toastr.error(errorMsg);
        this.isLoading = false;
      },
    });
  }

  onUpdateUsername(): void {
    if (!this.newUsername || this.newUsername.trim() === '') {
      this.toastr.warning('Username cannot be empty.');
      return;
    }

    if (this.newUsername.trim() === this.username) {
      this.toastr.info('Username is the same as the current one.');
      return;
    }

    this.isSavingUsername = true;
    this.profileService.updateUsername(this.newUsername.trim()).subscribe({
      next: (res) => {
        this.toastr.success(res.message || 'Username updated successfully. Please log in again.');
        this.isSavingUsername = false;
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Failed to update username.';
        this.toastr.error(errorMsg);
        this.isSavingUsername = false;
      },
    });
  }

  onUpdatePassword(): void {
    if (!this.currentPasswordForUser) {
      this.toastr.warning('Please enter your current password.');
      return;
    }

    if (!this.newPassword || this.newPassword.length < 6) {
      this.toastr.warning('New password must be at least 6 characters long.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toastr.error('New password and confirm password do not match.');
      return;
    }

    this.isSavingPassword = true;
    const updateData = {
      currentPassword: this.currentPasswordForUser,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword,
    };

    this.profileService.updatePassword(updateData).subscribe({
      next: (res) => {
        this.toastr.success(res.message || 'Password updated successfully. Please log in again.');
        this.isSavingPassword = false;
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Failed to update password.';
        this.toastr.error(errorMsg);
        this.isSavingPassword = false;
      },
    });
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.toastr.success('Logged out successfully');
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.toastr.error('Logout failed, please try again');
      },
    });
  }

  toggleMode(): void {
    this.themeService.toggleDarkMode();
    this.isSunVisible = !this.themeService.isDarkMode();
  }
}
