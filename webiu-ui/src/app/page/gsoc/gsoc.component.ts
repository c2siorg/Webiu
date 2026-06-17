import { Component, OnInit, inject } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { GsocService, GsocProgram, GsocIdea } from '../../services/gsoc.service';

@Component({
  selector: 'app-gsoc',
  standalone: true,
  imports: [NavbarComponent, CommonModule],
  templateUrl: './gsoc.component.html',
  styleUrl: './gsoc.component.scss',
})
export class GsocComponent implements OnInit {
  private gsocService = inject(GsocService);

  program: GsocProgram | null = null;
  ideas: GsocIdea[] = [];
  activeProjectIndex: number | null = null;
  isLoading = true;

  ngOnInit(): void {
    this.loadCurrentGsocData();
  }

  loadCurrentGsocData(): void {
    this.isLoading = true;
    
    // Load current public program information
    this.gsocService.getCurrentProgram().subscribe({
      next: (progRes) => {
        if (progRes.success) {
          this.program = progRes.program;
        }
        
        // Load published project ideas corresponding to the current year
        this.gsocService.getCurrentIdeas().subscribe({
          next: (ideasRes) => {
            if (ideasRes.success) {
              this.ideas = ideasRes.ideas;
            }
            this.isLoading = false;
          },
          error: () => {
            this.ideas = [];
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.program = null;
        this.isLoading = false;
      }
    });
  }

  toggleAccordion(index: number): void {
    if (this.activeProjectIndex === index) {
      this.activeProjectIndex = null;
    } else {
      this.activeProjectIndex = index;
    }
  }
}
