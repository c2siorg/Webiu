import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { GsocService, GsocProgram, GsocIdea, GsocMentor } from '../../services/gsoc.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminBaseComponent } from '../admin-base/admin-base.component';

@Component({
  selector: 'app-admin-ideas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-ideas.component.html',
  styleUrls: ['./admin-ideas.component.scss'],
})
export class AdminIdeasComponent extends AdminBaseComponent implements OnInit {
  private gsocService = inject(GsocService);
  private route = inject(ActivatedRoute);

  // UI state
  activeTab: 'programs' | 'ideas' | 'mentors' = 'programs';

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
  ideaForm: Partial<GsocIdea> & { mentorIds: string[] } = {
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

  override ngOnInit(): void {
    super.ngOnInit();
    
    // Listen to query parameters to change tab dynamically
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
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
    this.gsocService.getPrograms()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.programs = res.programs || [];
            if (this.programs.length > 0 && !this.selectedProgramId) {
              const active = this.programs.find(p => p.isActive);
              this.selectedProgramId = active ? active.id : this.programs[0].id;
              this.loadIdeas();
            }
          }
        },
        error: () => this.toastr.error('Failed to load GSoC programs.')
      });
  }

  loadIdeas(): void {
    if (!this.selectedProgramId) return;
    this.gsocService.getIdeas(this.selectedProgramId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.ideas = res.ideas || [];
          }
        },
        error: () => this.toastr.error('Failed to load project ideas.')
      });
  }

  loadMentors(): void {
    this.gsocService.getMentors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mentors = res.mentors || [];
          }
        },
        error: () => this.toastr.error('Failed to load GSoC mentors.')
      });
  }

  // --- Program CRUD Actions ---
  openProgramModal(prog?: GsocProgram): void {
    if (prog) {
      this.editingProgramId = prog.id;
      this.programForm = { ...prog };
    } else {
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
    }
    this.showProgramModal = true;
  }

  saveProgram(): void {
    if (this.editingProgramId) {
      this.gsocService.updateProgram(this.editingProgramId, this.programForm)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('GSoC program updated successfully.');
            this.showProgramModal = false;
            this.loadPrograms();
          },
          error: () => this.toastr.error('Failed to update GSoC program.')
        });
    } else {
      this.gsocService.createProgram(this.programForm)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('GSoC program created successfully.');
            this.showProgramModal = false;
            this.loadPrograms();
          },
          error: () => this.toastr.error('Failed to create GSoC program.')
        });
    }
  }

  deleteProgram(id: string): void {
    if (!confirm('Are you sure you want to delete this GSoC Program? This deletes all associated ideas!')) return;
    this.gsocService.deleteProgram(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('GSoC program deleted.');
          if (this.selectedProgramId === id) this.selectedProgramId = '';
          this.loadPrograms();
        },
        error: () => this.toastr.error('Failed to delete GSoC program.')
      });
  }

  // --- Idea CRUD Actions ---
  openIdeaModal(idea?: GsocIdea): void {
    if (idea) {
      this.editingIdeaId = idea.id;
      this.ideaForm = {
        ...idea,
        mentorIds: (idea.mentors || []).map(m => m.id),
      };
    } else {
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
    }
    this.showIdeaModal = true;
  }

  saveIdea(): void {
    this.ideaForm.programId = this.selectedProgramId;
    if (this.editingIdeaId) {
      this.gsocService.updateIdea(this.editingIdeaId, this.ideaForm)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('Project idea updated.');
            this.showIdeaModal = false;
            this.loadIdeas();
          },
          error: () => this.toastr.error('Failed to update project idea.')
        });
    } else {
      this.gsocService.createIdea(this.ideaForm)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('Project idea created.');
            this.showIdeaModal = false;
            this.loadIdeas();
          },
          error: () => this.toastr.error('Failed to create project idea.')
        });
    }
  }

  deleteIdea(id: string): void {
    if (!confirm('Are you sure you want to delete this project idea?')) return;
    this.gsocService.deleteIdea(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('Project idea deleted.');
          this.loadIdeas();
        },
        error: () => this.toastr.error('Failed to delete project idea.')
      });
  }

  // --- Mentor CRUD Actions ---
  openMentorModal(mentor?: GsocMentor): void {
    if (mentor) {
      this.editingMentorId = mentor.id;
      this.mentorForm = { ...mentor };
    } else {
      this.editingMentorId = null;
      this.mentorForm = { name: '', githubHandle: '' };
    }
    this.showMentorModal = true;
  }

  saveMentor(): void {
    if (this.editingMentorId) {
      this.gsocService.updateMentor(this.editingMentorId, this.mentorForm)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('Mentor profile updated.');
            this.showMentorModal = false;
            this.loadMentors();
            if (this.selectedProgramId) this.loadIdeas();
          },
          error: () => this.toastr.error('Failed to update mentor.')
        });
    } else {
      this.gsocService.createMentor(this.mentorForm)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('Mentor profile created.');
            this.showMentorModal = false;
            this.loadMentors();
          },
          error: () => this.toastr.error('Failed to create mentor.')
        });
    }
  }

  deleteMentor(id: string): void {
    if (!confirm('Are you sure you want to delete this mentor profile?')) return;
    this.gsocService.deleteMentor(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('Mentor profile deleted.');
          this.loadMentors();
          if (this.selectedProgramId) this.loadIdeas();
        },
        error: () => this.toastr.error('Failed to delete mentor.')
      });
  }

  // --- Drag and drop ordering ---
  moveUp(index: number): void {
    if (index === 0) return;
    this.swapOrder(index, index - 1);
  }

  moveDown(index: number): void {
    if (index === this.ideas.length - 1) return;
    this.swapOrder(index, index + 1);
  }

  private swapOrder(index1: number, index2: number): void {
    const temp = this.ideas[index1];
    this.ideas[index1] = this.ideas[index2];
    this.ideas[index2] = temp;

    // Persist reordered IDs to backend
    const orderedIds = this.ideas.map(i => i.id);
    this.gsocService.reorderIdeas(orderedIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('Reordered GSoC project ideas successfully.');
          this.loadIdeas();
        },
      });
  }

  openAddProgramModal(): void {
    this.openProgramModal();
  }

  openEditProgramModal(prog: GsocProgram): void {
    this.openProgramModal(prog);
  }

  onProgramSelectChange(): void {
    this.loadIdeas();
  }

  openAddIdeaModal(): void {
    this.openIdeaModal();
  }

  openEditIdeaModal(idea: GsocIdea): void {
    this.openIdeaModal(idea);
  }

  moveIdeaUp(index: number): void {
    this.moveUp(index);
  }

  moveIdeaDown(index: number): void {
    this.moveDown(index);
  }

  openAddMentorModal(): void {
    this.openMentorModal();
  }

  openEditMentorModal(mentor: GsocMentor): void {
    this.openMentorModal(mentor);
  }

  toggleMentorSelection(mentorId: string): void {
    if (!this.ideaForm.mentorIds) {
      this.ideaForm.mentorIds = [];
    }
    const idx = this.ideaForm.mentorIds.indexOf(mentorId);
    if (idx > -1) {
      this.ideaForm.mentorIds.splice(idx, 1);
    } else {
      this.ideaForm.mentorIds.push(mentorId);
    }
  }

  // --- Layout Helper Tasks ---
  setTab(tab: 'programs' | 'ideas' | 'mentors'): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }
}
