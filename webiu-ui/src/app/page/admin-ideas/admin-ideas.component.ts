import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { GsocService, GsocProgram, GsocIdea, GsocMentor } from '../../services/gsoc.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-ideas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-ideas.component.html',
  styleUrls: ['./admin-ideas.component.scss'],
})
export class AdminIdeasComponent implements OnInit {
  private gsocService = inject(GsocService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastr = inject(ToastrService);

  // UI state
  activeTab: 'programs' | 'ideas' | 'mentors' = 'programs';
  isSunVisible = true;

  // Data lists
  programs: GsocProgram[] = [];
  ideas: GsocIdea[] = [];
  mentors: GsocMentor[] = [];

  // Filter & selections
  selectedProgramId = '';

  // Program Form Model
  programForm: Partial<GsocProgram> = {
    year: new Date().getFullYear(),
    title: '',
    description: '',
    heroImageUrl: '',
    introHtml: '',
    slackUrl: '',
    proposalTemplateUrl: '',
    githubOrgUrl: '',
    status: 'DRAFT',
    isActive: false,
  };
  editingProgramId: string | null = null;
  showProgramModal = false;

  // Idea Form Model
  ideaForm: any = {
    programId: '',
    projectNumber: 1,
    title: '',
    explanation: '',
    expectedResults: '',
    prerequisites: '',
    difficulty: 'Medium',
    durationHours: 350,
    slackChannel: '',
    githubUrl: '',
    status: 'DRAFT',
    mentorIds: [],
  };
  editingIdeaId: string | null = null;
  showIdeaModal = false;

  // Mentor Form Model
  mentorForm: Partial<GsocMentor> = {
    name: '',
    githubHandle: '',
  };
  editingMentorId: string | null = null;
  showMentorModal = false;

  ngOnInit(): void {
    this.isSunVisible = !this.themeService.isDarkMode();
    
    // Listen to query parameters to change tab dynamically
    this.route.queryParams.subscribe((params) => {
      if (params['tab'] === 'ideas') {
        this.activeTab = 'ideas';
      } else if (params['tab'] === 'mentors') {
        this.activeTab = 'mentors';
      } else {
        this.activeTab = 'programs';
      }
    });

    this.loadAllData();
  }

  loadAllData(): void {
    this.loadPrograms();
    this.loadMentors();
  }

  loadPrograms(): void {
    this.gsocService.getPrograms().subscribe({
      next: (res) => {
        if (res.success) {
          this.programs = res.programs;
          if (this.programs.length > 0 && !this.selectedProgramId) {
            // Find active program or default to first
            const active = this.programs.find((p) => p.isActive);
            this.selectedProgramId = active ? active.id : this.programs[0].id;
          }
          // Load ideas for selected program
          this.loadIdeas();
        }
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to load programs');
      },
    });
  }

  loadIdeas(): void {
    if (!this.selectedProgramId) {
      this.ideas = [];
      return;
    }
    this.gsocService.getIdeas(this.selectedProgramId).subscribe({
      next: (res) => {
        if (res.success) {
          this.ideas = res.ideas;
        }
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to load ideas');
      },
    });
  }

  loadMentors(): void {
    this.gsocService.getMentors().subscribe({
      next: (res) => {
        if (res.success) {
          this.mentors = res.mentors;
        }
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to load mentors');
      },
    });
  }

  onProgramSelectChange(): void {
    this.loadIdeas();
  }

  // --- Program CRUD ---
  openAddProgramModal(): void {
    this.editingProgramId = null;
    this.programForm = {
      year: new Date().getFullYear(),
      title: '',
      description: '',
      heroImageUrl: '',
      introHtml: '',
      slackUrl: '',
      proposalTemplateUrl: '',
      githubOrgUrl: '',
      status: 'DRAFT',
      isActive: false,
    };
    this.showProgramModal = true;
  }

  openEditProgramModal(program: GsocProgram): void {
    this.editingProgramId = program.id;
    this.programForm = { ...program };
    this.showProgramModal = true;
  }

  saveProgram(): void {
    if (!this.programForm.title || !this.programForm.year) {
      this.toastr.warning('Please fill in required fields');
      return;
    }

    if (this.editingProgramId) {
      this.gsocService.updateProgram(this.editingProgramId, this.programForm).subscribe({
        next: (res) => {
          this.toastr.success(res.message || 'Program updated successfully');
          this.showProgramModal = false;
          this.loadPrograms();
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Failed to update program');
        },
      });
    } else {
      this.gsocService.createProgram(this.programForm).subscribe({
        next: (res) => {
          this.toastr.success(res.message || 'Program created successfully');
          this.showProgramModal = false;
          this.loadPrograms();
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Failed to create program');
        },
      });
    }
  }

  deleteProgram(id: string): void {
    if (confirm('Are you sure you want to delete this GSoC Program year? All associated project ideas will be deleted.')) {
      this.gsocService.deleteProgram(id).subscribe({
        next: (res) => {
          this.toastr.success(res.message || 'Program deleted successfully');
          if (this.selectedProgramId === id) {
            this.selectedProgramId = '';
          }
          this.loadPrograms();
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Failed to delete program');
        },
      });
    }
  }

  // --- Idea CRUD ---
  openAddIdeaModal(): void {
    this.editingIdeaId = null;
    this.ideaForm = {
      programId: this.selectedProgramId,
      projectNumber: this.ideas.length + 1,
      title: '',
      explanation: '',
      expectedResults: '',
      prerequisites: '',
      difficulty: 'Medium',
      durationHours: 350,
      slackChannel: '',
      githubUrl: '',
      status: 'DRAFT',
      mentorIds: [],
    };
    this.showIdeaModal = true;
  }

  openEditIdeaModal(idea: GsocIdea): void {
    this.editingIdeaId = idea.id;
    this.ideaForm = {
      ...idea,
      mentorIds: idea.mentors.map((m) => m.id),
    };
    this.showIdeaModal = true;
  }

  toggleMentorSelection(mentorId: string): void {
    const idx = this.ideaForm.mentorIds.indexOf(mentorId);
    if (idx > -1) {
      this.ideaForm.mentorIds.splice(idx, 1);
    } else {
      this.ideaForm.mentorIds.push(mentorId);
    }
  }

  saveIdea(): void {
    if (!this.ideaForm.title || !this.ideaForm.explanation || !this.ideaForm.programId) {
      this.toastr.warning('Please fill in required fields');
      return;
    }

    if (this.editingIdeaId) {
      this.gsocService.updateIdea(this.editingIdeaId, this.ideaForm).subscribe({
        next: (res) => {
          this.toastr.success(res.message || 'Idea updated successfully');
          this.showIdeaModal = false;
          this.loadIdeas();
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Failed to update idea');
        },
      });
    } else {
      this.gsocService.createIdea(this.ideaForm).subscribe({
        next: (res) => {
          this.toastr.success(res.message || 'Idea created successfully');
          this.showIdeaModal = false;
          this.loadIdeas();
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Failed to create idea');
        },
      });
    }
  }

  deleteIdea(id: string): void {
    if (confirm('Are you sure you want to delete this project idea?')) {
      this.gsocService.deleteIdea(id).subscribe({
        next: (res) => {
          this.toastr.success(res.message || 'Idea deleted successfully');
          this.loadIdeas();
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Failed to delete idea');
        },
      });
    }
  }

  // --- Mentor CRUD ---
  openAddMentorModal(): void {
    this.editingMentorId = null;
    this.mentorForm = {
      name: '',
      githubHandle: '',
    };
    this.showMentorModal = true;
  }

  openEditMentorModal(mentor: GsocMentor): void {
    this.editingMentorId = mentor.id;
    this.mentorForm = { ...mentor };
    this.showMentorModal = true;
  }

  saveMentor(): void {
    if (!this.mentorForm.name) {
      this.toastr.warning('Please enter mentor name');
      return;
    }

    if (this.editingMentorId) {
      this.gsocService.updateMentor(this.editingMentorId, this.mentorForm).subscribe({
        next: (res) => {
          this.toastr.success(res.message || 'Mentor updated successfully');
          this.showMentorModal = false;
          this.loadMentors();
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Failed to update mentor');
        },
      });
    } else {
      this.gsocService.createMentor(this.mentorForm).subscribe({
        next: (res) => {
          this.toastr.success(res.message || 'Mentor created successfully');
          this.showMentorModal = false;
          this.loadMentors();
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Failed to create mentor');
        },
      });
    }
  }

  deleteMentor(id: string): void {
    if (confirm('Are you sure you want to delete this mentor?')) {
      this.gsocService.deleteMentor(id).subscribe({
        next: (res) => {
          this.toastr.success(res.message || 'Mentor deleted successfully');
          this.loadMentors();
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Failed to delete mentor');
        },
      });
    }
  }

  // --- Reordering Logic ---
  moveIdeaUp(index: number): void {
    if (index === 0) return;
    this.swapIdeas(index, index - 1);
  }

  moveIdeaDown(index: number): void {
    if (index === this.ideas.length - 1) return;
    this.swapIdeas(index, index + 1);
  }

  private swapIdeas(idx1: number, idx2: number): void {
    const temp = this.ideas[idx1];
    this.ideas[idx1] = this.ideas[idx2];
    this.ideas[idx2] = temp;
    
    // Save reordered states to DB
    const orderedIds = this.ideas.map((idea) => idea.id);
    this.gsocService.reorderIdeas(orderedIds).subscribe({
      next: () => {
        this.toastr.success('Ideas order updated');
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to save ideas order');
        // Reload to revert order
        this.loadIdeas();
      },
    });
  }

  // --- Layout Helper Tasks ---
  setTab(tab: 'programs' | 'ideas' | 'mentors'): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }

  toggleMode(): void {
    this.themeService.toggleDarkMode();
    this.isSunVisible = !this.themeService.isDarkMode();
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
}
