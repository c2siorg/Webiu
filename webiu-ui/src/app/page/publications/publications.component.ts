import { Component, HostListener } from '@angular/core';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import { PublicationsCardComponent } from '../../components/publications-card/publications-card.component';
import { publicationsData } from './publications-data';



@Component({
  selector: 'app-publications',
  standalone: true,
  imports: [NavbarComponent, PublicationsCardComponent],
  templateUrl: './publications.component.html',
  styleUrls: ['./publications.component.scss'],
})
export class PublicationsComponent {
  publicationsData = publicationsData;
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
