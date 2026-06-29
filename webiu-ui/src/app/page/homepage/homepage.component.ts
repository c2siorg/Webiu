import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { getHomepageDetails } from '../../common/data/homepage';
import { HttpClient } from '@angular/common/http';
import { HeroNoiseBackgroundComponent } from '../../components/hero-noise-background/hero-noise-background.component';
import { SearchService } from '../../services/search.service';
import { RevealOnScrollDirective } from '../../shared/reveal-on-scroll.directive';
import { ParallaxDirective } from '../../shared/parallax.directive';
import { CountUpDirective } from '../../shared/count-up.directive';
import { LANGUAGE_COLORS, DEFAULT_LANGUAGE_COLOR } from '../../common/data/language-colors';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeroNoiseBackgroundComponent,
    RevealOnScrollDirective,
    ParallaxDirective,
    CountUpDirective,
  ],
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

  getLanguageColor(language: string): string {
    return LANGUAGE_COLORS[language] ?? DEFAULT_LANGUAGE_COLOR;
  }
}
