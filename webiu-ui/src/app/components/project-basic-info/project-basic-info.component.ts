import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../page/projects/project.model';
import { LANGUAGE_COLORS, DEFAULT_LANGUAGE_COLOR } from '../../common/utils/language-colors';

interface LanguageEntry {
  name: string;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-project-basic-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-basic-info.component.html',
  styleUrls: ['./project-basic-info.component.scss'],
})
export class ProjectBasicInfoComponent implements OnChanges {
  @Input({ required: true }) project!: Project;

  languagesList: LanguageEntry[] = [];

  ngOnChanges(): void {
    this.languagesList = this.buildLanguagesList();
  }

  private buildLanguagesList(): LanguageEntry[] {
    if (!this.project.languages) return [];

    const total = Object.values(this.project.languages).reduce(
      (a, b) => a + b,
      0,
    );
    if (total === 0) return [];

    return Object.entries(this.project.languages)
      .map(([name, value]) => ({
        name,
        percentage: Math.round((value / total) * 100),
        color: LANGUAGE_COLORS[name] || DEFAULT_LANGUAGE_COLOR,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }
}
