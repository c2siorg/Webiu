import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GsocService, GsocProgram, GsocIdea } from '../../services/gsoc.service';

const MOCK_PROGRAM: GsocProgram = {
  id: 'mock-program',
  title: 'Google Summer of Code 2026 (Local Mock)',
  description: 'Welcome to the local development environment for C2SI GSoC project ideas. The database appears to be empty, so this mock program is loaded automatically.',
  heroImageUrl: '../../../assets/gsoc_no_bg.png',
  introHtml: `
    <h3>Getting Started</h3>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
    <h3>How to Apply</h3>
    <ul>
      <li>Read through the published project ideas below.</li>
      <li>Discuss with mentors in the respective Slack channels.</li>
      <li>Follow the C2SI guidelines to submit your proposal on the official GSoC portal.</li>
    </ul>
  `,
  year: 2026,
  status: 'PUBLISHED',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const MOCK_IDEAS: GsocIdea[] = [
  {
    id: 'mock-idea-1',
    projectNumber: 1,
    title: 'Interactive Codebase Visualizer in VR',
    durationHours: 350,
    difficulty: 'Hard',
    explanation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    expectedResults: 'A functional virtual reality visualization component demonstrating structure and relationships inside repositories.',
    prerequisites: 'Angular, Three.js, WebXR API, TypeScript',
    githubUrl: 'https://github.com/c2siorg/Webiu',
    slackChannel: '#visualizer-vr',
    mentors: [{ id: 'mentor-1', name: 'Tarunya K', githubHandle: 'TarunyaProgrammer', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
    programId: 'mock-program',
    status: 'PUBLISHED',
    displayOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-idea-2',
    projectNumber: 2,
    title: 'Automated Multi-Agent Security Auditor',
    durationHours: 175,
    difficulty: 'Medium',
    explanation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Duis aute irure dolor in reprehenderit in voluptate velit.',
    expectedResults: 'An automated pipeline running static analysis tools via customized LLM agents to detect vulnerabilities.',
    prerequisites: 'Python, NestJS, LLM API, Docker',
    githubUrl: 'https://github.com/c2siorg/Webiu',
    slackChannel: '#security-auditor',
    mentors: [{ id: 'mentor-2', name: 'John Doe', githubHandle: 'johndoe', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
    programId: 'mock-program',
    status: 'PUBLISHED',
    displayOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-idea-3',
    projectNumber: 3,
    title: 'Smart Decentralized Pub-Sub Hub',
    durationHours: 350,
    difficulty: 'Hard',
    explanation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate.',
    expectedResults: 'A decentralized pub-sub message broker implemented with high-throughput and smart routing mechanisms.',
    prerequisites: 'Go, WebSockets, Protobuf, gRPC',
    githubUrl: 'https://github.com/c2siorg/Webiu',
    slackChannel: '#decentralized-hub',
    mentors: [{ id: 'mentor-3', name: 'Alice Smith', githubHandle: 'alicesmith', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
    programId: 'mock-program',
    status: 'PUBLISHED',
    displayOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-idea-4',
    projectNumber: 4,
    title: 'Real-Time Performance Profiling Dashboard',
    durationHours: 175,
    difficulty: 'Easy',
    explanation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Ut enim ad minim veniam, quis nostrud.',
    expectedResults: 'A web dashboard showing memory usage, CPU load, and response time metrics visually in real-time.',
    prerequisites: 'Angular, RxJS, Chart.js, CSS Grid',
    githubUrl: 'https://github.com/c2siorg/Webiu',
    slackChannel: '#performance-dashboard',
    mentors: [{ id: 'mentor-4', name: 'Bob Johnson', githubHandle: 'bobjohnson', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
    programId: 'mock-program',
    status: 'PUBLISHED',
    displayOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

@Component({
  selector: 'app-gsoc',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gsoc.component.html',
  styleUrl: './gsoc.component.scss',
})
export class GsocComponent implements OnInit {
  private gsocService = inject(GsocService);

  program: GsocProgram | null = null;
  ideas: GsocIdea[] = [];
  activeProjectIndex: number | null = null;
  isLoading = true;

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
          
          // Load published project ideas corresponding to the current year
          this.gsocService.getCurrentIdeas().subscribe({
            next: (ideasRes) => {
              if (ideasRes.success && ideasRes.ideas && ideasRes.ideas.length > 0) {
                this.ideas = ideasRes.ideas;
              } else {
                this.ideas = MOCK_IDEAS;
              }
              this.extractAvailableTechs();
              this.isLoading = false;
            },
            error: () => {
              this.ideas = MOCK_IDEAS;
              this.extractAvailableTechs();
              this.isLoading = false;
            }
          });
        } else {
          this.program = MOCK_PROGRAM;
          this.ideas = MOCK_IDEAS;
          this.extractAvailableTechs();
          this.isLoading = false;
        }
      },
      error: () => {
        this.program = MOCK_PROGRAM;
        this.ideas = MOCK_IDEAS;
        this.extractAvailableTechs();
        this.isLoading = false;
      }
    });
  }

  extractAvailableTechs(): void {
    const techSet = new Set<string>();
    this.ideas.forEach(idea => {
      if (idea.prerequisites) {
        idea.prerequisites.split(',').forEach(tech => {
          const trimmed = tech.trim();
          if (trimmed) {
            // Standardize some names if needed, otherwise just title case / trim
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
