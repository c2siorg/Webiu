import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpportunitiesData } from '../../common/data/opportunities';
import { RevealOnScrollDirective } from '../../shared/reveal-on-scroll.directive';
import { OpportunityService, Opportunity } from '../../services/opportunity.service';

@Component({
  selector: 'app-opportunities',
  standalone: true,
  imports: [CommonModule, RevealOnScrollDirective],
  templateUrl: './opportunities.component.html',
  styleUrl: './opportunities.component.scss'
  })
export class OpportunitiesComponent implements OnInit {
  private opportunityService = inject(OpportunityService);
  
  data = OpportunitiesData;
  opportunities: Opportunity[] = [];

  ngOnInit() {
    this.opportunityService.getPublicOpportunities().subscribe({
      next: (res) => {
        if (res.success) {
          this.opportunities = res.opportunities;
        }
      },
      error: (err) => console.error('Failed to load opportunities:', err)
    });
  }

  applyFor(url: string) {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}