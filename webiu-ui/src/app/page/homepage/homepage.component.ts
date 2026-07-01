import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { getHomepageDetails, HomepageFeaturedData } from '../../common/data/homepage';
import { getLanguageColor } from '../../common/utils/language-colors';
import { HttpClient } from '@angular/common/http';
import { SearchService } from '../../services/search.service';
import { HeroNoiseBackgroundComponent } from '../../components/hero-noise-background/hero-noise-background.component';
import { RevealOnScrollDirective } from '../../shared/reveal-on-scroll.directive';
import { ParallaxDirective } from '../../shared/parallax.directive';
import { CountUpDirective } from '../../shared/count-up.directive';

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
    this.http.get<HomepageFeaturedData>('assets/data/homepage-featured.json').subscribe({
      next: (data) => {
        this.homepageData = getHomepageDetails(data);
      },
      error: (err) => console.error('Failed to load homepage featured data', err),
    });
  }

  triggerSearch(event: Event): void {
    event.preventDefault();
    this.searchService.open();
  }

  getLanguageColor = getLanguageColor;
}
