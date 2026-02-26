import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { HomepageDetails } from '../../common/data/homepage';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [NavbarComponent, CommonModule, RouterModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
})
export class HomepageComponent {
  homepageData = HomepageDetails;

  // Get language color for projects
  getLanguageColor(language: string): string {
    const languageColors: Record<string, string> = {
      JavaScript: '#f1e05a',
      TypeScript: '#2b7489',
      Python: '#3572A5',
      Java: '#b07219',
      'C++': '#f34b7d',
      Go: '#00ADD8',
      Rust: '#dea584',
      Ruby: '#701516',
      PHP: '#4F5D95',
      Swift: '#ffac45',
    };
    return languageColors[language] || '#333';
  }
}
