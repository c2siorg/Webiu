import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../page/projects/project.model';

@Component({
  selector: 'app-project-basic-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-basic-info.component.html',
  styleUrls: ['./project-basic-info.component.scss'],
})
export class ProjectBasicInfoComponent {
  @Input({ required: true }) project!: Project;

  /**
   * Transforms raw language bytes into a sorted list of percentages for the tech stack bar.
   */
  get languagesList(): { name: string; percentage: number; color: string }[] {
    if (!this.project.languages) return [];

    const total = Object.values(this.project.languages).reduce(
      (a, b) => a + b,
      0,
    );
    return Object.entries(this.project.languages)
      .map(([name, value]) => ({
        name,
        percentage: Math.round((value / total) * 100),
        color: this.getLanguageColor(name),
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Maps GitHub language names to their official brand colors for UI consistency.
   */
  getLanguageColor(language: string): string {
    const languageColors: Record<string, string> = {
      Python: '#3572A5',
      JavaScript: '#F1E05A',
      TypeScript: '#3178C6',
      Java: '#B07219',
      HTML: '#E34C26',
      CSS: '#1572B6',
      SCSS: '#C6538C',
      'C++': '#00599C',
      'C#': '#178600',
      Go: '#00ADD8',
      Ruby: '#701516',
      PHP: '#4F5D95',
      Rust: '#dea584',
      Swift: '#F05138',
      Kotlin: '#7F52FF',
      Dart: '#00B4AB',
      HCL: '#0298C3',
      Shell: '#89e051',
      C: '#555555',
      Default: '#607466',
    };

    return languageColors[language] || languageColors['Default'];
  }
}
