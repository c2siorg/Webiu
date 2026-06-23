import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { getHomepageDetails } from '../../common/data/homepage';
import { HttpClient } from '@angular/common/http';
import { RepoIntelligenceCoreComponent } from '../../components/repo-intelligence-core/repo-intelligence-core.component';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, RouterModule, RepoIntelligenceCoreComponent],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
})
export class HomepageComponent implements OnInit {
  homepageData = getHomepageDetails();
  private http = inject(HttpClient);
  private searchService = inject(SearchService);

  ngOnInit() {
    this.http.get<any>('assets/data/projects.json').subscribe({
      next: (data) => {
        this.homepageData = getHomepageDetails(data);
      },
      error: (err) => console.error('Failed to load projects', err)
    });
  }

  triggerSearch(event: Event): void {
    event.preventDefault();
    this.searchService.open();
  }

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
