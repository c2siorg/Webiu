import { Component, HostListener } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { gsocData } from '../../common/data/gsoc2024';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gsoc2024',
  standalone: true,
  imports: [NavbarComponent, CommonModule],
  templateUrl: './gsoc2024.component.html',
  styleUrl: './gsoc2024.component.scss',
})
export class Gsoc2024Component {
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
    this.showButton = window.scrollY > 100;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
