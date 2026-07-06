import { Component, OnInit, inject, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GsocService, GsocProgram, GsocIdea } from '../../services/gsoc.service';
import { MOCK_PROGRAM, MOCK_IDEAS } from '../../common/data/gsoc-mock';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-gsoc',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gsoc.component.html',
  styleUrl: './gsoc.component.scss',
})
export class GsocComponent implements OnInit {
  private gsocService = inject(GsocService);
  private sanitizer = inject(DomSanitizer);

  program: GsocProgram | null = null;
  ideas: GsocIdea[] = [];
  activeProjectIndex: number | null = null;
  isLoading = true;
  safeIntroHtml: SafeHtml = '';

  // Search & Filter State
  searchQuery = '';
  selectedDifficulty = 'All';
  selectedTech = 'All';
  availableTechs: string[] = [];

  ngOnInit(): void {
    this.loadCurrentGsocData();
  }

  loadCurrentGsocData(): void {
    this.isLoading = true;
    
    // Load current public program information
    this.gsocService.getCurrentProgram().subscribe({
      next: (progRes) => {
        if (progRes.success && progRes.program) {
          this.program = progRes.program;
          this.safeIntroHtml = this.getSafeHtml(this.program.introHtml);
          
          // Load published project ideas corresponding to the current year
          this.gsocService.getCurrentIdeas().subscribe({
            next: (ideasRes) => {
              if (ideasRes.success && ideasRes.ideas && ideasRes.ideas.length > 0) {
                this.ideas = ideasRes.ideas;
              } else {
                this.ideas = environment.production ? [] : MOCK_IDEAS;
              }
              this.extractAvailableTechs();
              this.isLoading = false;
            },
            error: () => {
              this.ideas = environment.production ? [] : MOCK_IDEAS;
              this.extractAvailableTechs();
              this.isLoading = false;
            }
          });
        } else {
          this.program = environment.production ? null : MOCK_PROGRAM;
          this.safeIntroHtml = environment.production ? '' : this.getSafeHtml(MOCK_PROGRAM.introHtml);
          this.ideas = environment.production ? [] : MOCK_IDEAS;
          this.extractAvailableTechs();
          this.isLoading = false;
        }
      },
      error: () => {
        this.program = environment.production ? null : MOCK_PROGRAM;
        this.safeIntroHtml = environment.production ? '' : this.getSafeHtml(MOCK_PROGRAM.introHtml);
        this.ideas = environment.production ? [] : MOCK_IDEAS;
        this.extractAvailableTechs();
        this.isLoading = false;
      }
    });
  }

  getSafeHtml(html: string | undefined): SafeHtml {
    const rawHtml = html || '';
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, rawHtml) || '';
    return this.sanitizer.bypassSecurityTrustHtml(sanitized);
  }

  extractAvailableTechs(): void {
    const techSet = new Set<string>();
    this.ideas.forEach(idea => {
      if (idea.prerequisites) {
        idea.prerequisites.split(',').forEach(tech => {
          const trimmed = tech.trim();
          if (trimmed) {
            techSet.add(trimmed);
          }
        });
      }
    });
    this.availableTechs = Array.from(techSet).sort();
  }

  get filteredIdeas(): GsocIdea[] {
    return this.ideas.filter(idea => {
      // Difficulty match
      const matchesDifficulty = this.selectedDifficulty === 'All' || 
        idea.difficulty.toLowerCase() === this.selectedDifficulty.toLowerCase();
      
      // Technology match
      const matchesTech = this.selectedTech === 'All' || (
        idea.prerequisites && 
        idea.prerequisites.split(',').map(t => t.trim().toLowerCase()).includes(this.selectedTech.toLowerCase())
      );

      // Search query match
      const matchesSearch = !this.searchQuery || 
        idea.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (idea.explanation && idea.explanation.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (idea.expectedResults && idea.expectedResults.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (idea.prerequisites && idea.prerequisites.toLowerCase().includes(this.searchQuery.toLowerCase()));

      return matchesDifficulty && matchesTech && matchesSearch;
    });
  }

  setDifficulty(difficulty: string): void {
    this.selectedDifficulty = difficulty;
    this.activeProjectIndex = null; // Reset accordion on filter change
  }

  setTech(tech: string): void {
    this.selectedTech = tech;
    this.activeProjectIndex = null; // Reset accordion on filter change
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.activeProjectIndex = null;
  }

  splitPrerequisites(prereqs: string): string[] {
    if (!prereqs) return [];
    return prereqs.split(',').map(p => p.trim()).filter(p => p.length > 0);
  }

  toggleAccordion(index: number): void {
    if (this.activeProjectIndex === index) {
      this.activeProjectIndex = null;
    } else {
      this.activeProjectIndex = index;
    }
  }
}
