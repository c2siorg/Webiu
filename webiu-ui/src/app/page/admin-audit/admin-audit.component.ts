import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../services/audit.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminBaseComponent } from '../admin-base/admin-base.component';

export interface AuditLogEntry {
  id: string;
  userId: string;
  username: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | Date;
  admin?: { username: string };
  metadata?: any;
}

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-audit.component.html',
  styleUrls: ['./admin-audit.component.scss'],
})
export class AdminAuditComponent extends AdminBaseComponent implements OnInit {
  private auditService = inject(AuditService);

  logs: AuditLogEntry[] = [];
  total = 0;
  page = 1;
  limit = 10;
  totalPages = 1;

  // Filter properties
  selectedAction = '';
  selectedEntityType = '';
  startDate = '';
  endDate = '';

  // Selected Log for Details Modal
  selectedLog: AuditLogEntry | null = null;
  showModal = false;
  isLoading = false;

  actionOptions = [
    'LOGIN',
    'LOGOUT',
    'SETTING_UPDATED',
    'PROGRAM_CREATED',
    'PROGRAM_UPDATED',
    'PROGRAM_PUBLISHED',
    'PROGRAM_ARCHIVED',
    'IDEA_CREATED',
    'IDEA_UPDATED',
    'IDEA_DELETED',
    'IDEA_PUBLISHED',
    'MENTOR_CREATED',
    'MENTOR_UPDATED',
    'MENTOR_DELETED',
    'PASSWORD_CHANGED',
    'USERNAME_CHANGED'
  ];

  entityTypeOptions = [
    'settings',
    'gsoc_program',
    'gsoc_idea',
    'mentor',
    'profile'
  ];

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading = true;
    const filters = {
      page: this.page,
      limit: this.limit,
      action: this.selectedAction || undefined,
      entityType: this.selectedEntityType || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined
    };

    this.auditService.getAuditLogs(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.logs = res.logs;
            this.total = res.total;
            this.page = res.page;
            this.limit = res.limit;
            this.totalPages = res.totalPages;
          }
          this.isLoading = false;
        },
        error: (err) => {
          const errorMsg = err.error?.message || 'Failed to load audit logs';
          this.toastr.error(errorMsg);
          this.isLoading = false;
        }
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadLogs();
  }

  clearFilters(): void {
    this.selectedAction = '';
    this.selectedEntityType = '';
    this.startDate = '';
    this.endDate = '';
    this.page = 1;
    this.loadLogs();
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.loadLogs();
  }

  viewDetails(logId: string): void {
    this.auditService.getAuditLogDetails(logId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.selectedLog = res.log;
            this.showModal = true;
          }
        },
        error: (err) => {
          const errorMsg = err.error?.message || 'Failed to load log details';
          this.toastr.error(errorMsg);
        }
      });
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedLog = null;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }

  formatJson(value: string | null): string {
    if (!value) return 'N/A';
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }
}
