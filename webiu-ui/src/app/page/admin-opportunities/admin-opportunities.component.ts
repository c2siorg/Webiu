import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { OpportunityService, Opportunity } from '../../services/opportunity.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminBaseComponent } from '../admin-base/admin-base.component';

@Component({
  selector: 'app-admin-opportunities',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-opportunities.component.html',
  styleUrls: ['./admin-opportunities.component.scss'],
})
export class AdminOpportunitiesComponent extends AdminBaseComponent implements OnInit {
  private opportunityService = inject(OpportunityService);

  opportunities: Opportunity[] = [];
  isLoading = true;

  // Form Model
  oppForm: Partial<Opportunity> = {
    title: '',
    opportunityType: '',
    shortDescription: '',
    fullDescription: '',
    preferredStacks: [],
    applyButtonText: 'Apply Now',
    applyUrl: '',
    status: 'Draft',
    opensAt: '',
    closesAt: '',
  };

  newStackInput = '';
  editingOppId: string | null = null;
  showModal = false;
  showPreview = false;
  previewOpp: Opportunity | null = null;

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadOpportunities();
  }

  loadOpportunities(): void {
    this.isLoading = true;
    this.opportunityService.getAdminOpportunities()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.opportunities = res.opportunities;
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Failed to load opportunities');
          this.isLoading = false;
        },
      });
  }

  openAddModal(): void {
    this.editingOppId = null;
    this.oppForm = {
      title: '',
      opportunityType: '',
      shortDescription: '',
      fullDescription: '',
      preferredStacks: [],
      applyButtonText: 'Apply Now',
      applyUrl: '',
      status: 'Draft',
      opensAt: '',
      closesAt: '',
    };
    this.newStackInput = '';
    this.showModal = true;
  }

  openEditModal(opp: Opportunity): void {
    this.editingOppId = opp.id;
    this.oppForm = {
      title: opp.title,
      opportunityType: opp.opportunityType,
      shortDescription: opp.shortDescription,
      fullDescription: opp.fullDescription || '',
      preferredStacks: [...(opp.preferredStacks || [])],
      applyButtonText: opp.applyButtonText,
      applyUrl: opp.applyUrl,
      status: opp.status,
      opensAt: opp.opensAt ? new Date(opp.opensAt).toISOString().slice(0, 16) : '',
      closesAt: opp.closesAt ? new Date(opp.closesAt).toISOString().slice(0, 16) : '',
    };
    this.newStackInput = '';
    this.showModal = true;
  }

  addStack(): void {
    const val = this.newStackInput.trim();
    if (val && this.oppForm.preferredStacks && !this.oppForm.preferredStacks.includes(val)) {
      this.oppForm.preferredStacks.push(val);
      this.newStackInput = '';
    }
  }

  removeStack(stack: string): void {
    if (this.oppForm.preferredStacks) {
      this.oppForm.preferredStacks = this.oppForm.preferredStacks.filter(s => s !== stack);
    }
  }

  saveOpportunity(): void {
    const payload = {
      ...this.oppForm,
      opensAt: this.oppForm.opensAt ? new Date(this.oppForm.opensAt as string).toISOString() : null,
      closesAt: this.oppForm.closesAt ? new Date(this.oppForm.closesAt as string).toISOString() : null,
    };

    if (this.editingOppId) {
      this.opportunityService.updateOpportunity(this.editingOppId, payload)
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.toastr.success('Opportunity updated successfully');
              this.showModal = false;
              this.loadOpportunities();
            }
          },
          error: (err) => this.toastr.error(err.error?.message || 'Failed to update opportunity'),
        });
    } else {
      this.opportunityService.createOpportunity(payload)
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.toastr.success('Opportunity created successfully');
              this.showModal = false;
              this.loadOpportunities();
            }
          },
          error: (err) => this.toastr.error(err.error?.message || 'Failed to create opportunity'),
        });
    }
  }

  deleteOpportunity(id: string): void {
    if (confirm('Are you sure you want to delete this opportunity?')) {
      this.opportunityService.deleteOpportunity(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success('Opportunity deleted successfully');
            this.loadOpportunities();
          }
        },
        error: (err) => this.toastr.error(err.error?.message || 'Failed to delete opportunity'),
      });
    }
  }

  openPreview(opp: Opportunity): void {
    this.previewOpp = opp;
    this.showPreview = true;
  }

  // Handle manual movement up / down in array for ordering
  moveOpportunity(index: number, direction: 'up' | 'down'): void {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= this.opportunities.length) return;

    // Swap elements
    const temp = this.opportunities[index];
    this.opportunities[index] = this.opportunities[targetIdx];
    this.opportunities[targetIdx] = temp;

    // Save ordering
    const orderedIds = this.opportunities.map(o => o.id);
    this.opportunityService.reorderOpportunities(orderedIds).subscribe({
      next: () => {
        this.toastr.success('Ordering updated');
      },
      error: () => {
        this.toastr.error('Failed to update ordering');
        this.loadOpportunities(); // Revert
      }
    });
  }
}
