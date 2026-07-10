import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpportunitiesData } from '../../common/data/opportunities';
import { OpportunitiesService, Opportunity } from '../../services/opportunities.service';

@Component({
  selector: 'app-opportunities',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './opportunities.component.html',
  styleUrl: './opportunities.component.scss'
})
export class OpportunitiesComponent implements OnInit {
  private oppService = inject(OpportunitiesService);

  data = OpportunitiesData;
  openings: Opportunity[] = [];
  loading = true;

  ngOnInit(): void {
    this.oppService.getPublishedOpenings().subscribe({
      next: (openings) => {
        this.openings = openings;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load openings:', err);
        this.loading = false;
      }
    });
  }
}