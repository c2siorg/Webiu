import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { PublicationsCardComponent } from '../../components/publications-card/publications-card.component';
import { publicationsData } from './publications-data';

interface Publication {
  heading: string;
  link: string;
  issued_by: string;
  description: string;
}

@Component({
  selector: 'app-publications',
  standalone: true,
  imports: [CommonModule, NavbarComponent, PublicationsCardComponent],
  templateUrl: './publications.component.html',
  styleUrls: ['./publications.component.scss'],
})
export class PublicationsComponent implements OnInit {
  publicationsData = publicationsData;
  showButton = false;
  constructor() {}

  ngOnInit(): void {}

  @HostListener('window:scroll')
      onWindowScroll() {
        // Show button when user scrolls down 100px from the top
        this.showButton = window.scrollY > 100;
      }
    
      scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
}
