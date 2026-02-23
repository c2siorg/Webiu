import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  templateUrl: './back-to-top.component.html',
  styleUrls: ['./back-to-top.component.scss'],
})
export class BackToTopComponent {
  showButton = false;

  @HostListener('window:scroll')
  onWindowScroll() {
    // Show button when user scrolls down 100px from the top
    this.showButton = window.scrollY > 100;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
