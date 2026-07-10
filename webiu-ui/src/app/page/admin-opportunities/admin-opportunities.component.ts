import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpportunitiesService, Opportunity } from '../../services/opportunities.service';

@Component({
  selector: 'app-admin-opportunities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-opportunities.component.html',
  styleUrls: ['./admin-opportunities.component.scss'],
})
export class AdminOpportunitiesComponent implements OnInit {
  private oppService = inject(OpportunitiesService);

  opportunities: Opportunity[] = [];
  loading = true;
  showForm = false;
  isEditing = false;

  // Form Model
  formModel: Partial<Opportunity> = {
    title: '',
    opportunityType: '',
    organization: '',
    description: '',
    requirements: [],
    applyButtonText: 'Apply Now',
    applyDestinationUrl: '',
    status: 'Draft',
    displayOrder: 0,
  };
  
  // Temporary string to bind requirements textarea
  requirementsInput = '';

  ngOnInit(): void {
    this.loadOpportunities();
  }

  loadOpportunities(): void {
    this.loading = true;
    this.oppService.getAllOpeningsAdmin().subscribe({
      next: (data) => {
        this.opportunities = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load opportunities:', err);
        this.loading = false;
      },
    });
  }

  openCreateForm(): void {
    this.isEditing = false;
    this.showForm = true;
    this.formModel = {
      title: '',
      opportunityType: '',
      organization: '',
      description: '',
      requirements: [],
      applyButtonText: 'Apply Now',
      applyDestinationUrl: '',
      status: 'Draft',
      displayOrder: this.opportunities.length,
    };
    this.requirementsInput = '';
  }

  openEditForm(opp: Opportunity): void {
    this.isEditing = true;
    this.showForm = true;
    this.formModel = { ...opp };
    this.requirementsInput = (opp.requirements || []).join(', ');
  }

  closeForm(): void {
    this.showForm = false;
  }

  saveOpportunity(): void {
    // Parse requirements comma-separated input to string array
    this.formModel.requirements = this.requirementsInput
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (this.isEditing && this.formModel._id) {
      this.oppService.updateOpening(this.formModel._id, this.formModel).subscribe({
        next: () => {
          this.loadOpportunities();
          this.closeForm();
        },
        error: (err) => console.error('Error updating opportunity:', err),
      });
    } else {
      this.oppService.createOpening(this.formModel).subscribe({
        next: () => {
          this.loadOpportunities();
          this.closeForm();
        },
        error: (err) => console.error('Error creating opportunity:', err),
      });
    }
  }

  deleteOpportunity(id: string | undefined): void {
    if (!id) return;
    if (confirm('Are you sure you want to delete this opportunity?')) {
      this.oppService.deleteOpening(id).subscribe({
        next: () => this.loadOpportunities(),
        error: (err) => console.error('Error deleting opportunity:', err),
      });
    }
  }

  moveUp(index: number): void {
    if (index === 0) return;
    this.swapOrders(index, index - 1);
  }

  moveDown(index: number): void {
    if (index === this.opportunities.length - 1) return;
    this.swapOrders(index, index + 1);
  }

  private swapOrders(idxA: number, idxB: number): void {
    const oppA = this.opportunities[idxA];
    const oppB = this.opportunities[idxB];

    if (!oppA._id || !oppB._id) return;

    // Swap displayOrder values
    const temp = oppA.displayOrder;
    oppA.displayOrder = oppB.displayOrder;
    oppB.displayOrder = temp;

    this.oppService.updateOpening(oppA._id, { displayOrder: oppA.displayOrder }).subscribe({
      next: () => {
        this.oppService.updateOpening(oppB._id!, { displayOrder: oppB.displayOrder }).subscribe({
          next: () => this.loadOpportunities(),
          error: (err) => console.error('Failed ordering update:', err),
        });
      },
      error: (err) => console.error('Failed ordering update:', err),
    });
  }
}
