import { Component, HostListener, PLATFORM_ID, inject } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { gsocData } from '../../common/data/gsoc';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-gsoc',
  standalone: true,
  imports: [NavbarComponent, CommonModule],
  templateUrl: './gsoc.component.html',
  styleUrl: './gsoc.component.scss',
})
export class GsocComponent {
  private platformId = inject(PLATFORM_ID);
  gsocData = gsocData;
  showButton = false;
  activeProjectIndex: number | null = null;

  toggleAccordion(index: number): void {
    if (this.activeProjectIndex === index) {
      this.activeProjectIndex = null;
    } else {
      this.activeProjectIndex = index;
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.showButton = window.scrollY > 100;
    }
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
