import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss']
})
export class AdminSidebarComponent {
  @Input() opened = false;
  @Input() isOverlay = false; // true on mobile overlay mode
  @Output() closeRequested = new EventEmitter<void>();

  // Navigation items – order matches for display
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'fa-solid fa-chart-pie', route: '/admin/dashboard' },
    { label: 'Settings', icon: 'fa-solid fa-gears', route: '/admin/settings' },
    { label: 'GSoC Years', icon: 'fa-solid fa-calendar-days', route: '/admin/ideas' },
    { label: 'Opportunities', icon: 'fa-solid fa-briefcase', route: '/admin/opportunities' },
    { label: 'Contributors', icon: 'fa-solid fa-users-gear', route: '/admin/contributors' },
    { label: 'Repositories', icon: 'fa-solid fa-database', route: '/admin/repositories' },
    { label: 'Profile', icon: 'fa-solid fa-user-gear', route: '/admin/profile' },
    { label: 'Audit Logs', icon: 'fa-solid fa-list-check', route: '/admin/audit' },
  ];

  onBackdropClick(): void {
    this.closeRequested.emit();
  }
}
