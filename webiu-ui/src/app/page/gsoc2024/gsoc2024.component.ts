import { Component, HostListener, PLATFORM_ID, inject } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { gsocData } from '../../common/data/gsoc2024';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-gsoc2024',
  standalone: true,
  imports: [NavbarComponent, CommonModule],
  templateUrl: './gsoc2024.component.html',
  styleUrl: './gsoc2024.component.scss',
})
export class Gsoc2024Component {
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
