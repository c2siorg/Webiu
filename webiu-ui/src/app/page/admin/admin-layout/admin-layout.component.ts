import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminBaseComponent } from '../../admin-base/admin-base.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, AdminSidebarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent extends AdminBaseComponent implements OnInit {
  override ngOnInit(): void {
    super.ngOnInit();
    // Default open on desktop
    this.sidebarOpened = this.isDesktop;
  }
}
