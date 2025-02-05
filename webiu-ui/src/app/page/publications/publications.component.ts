import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('scrollTopButton') scrollTopButton!: ElementRef;
  constructor() {}

  ngOnInit(): void {
    window.addEventListener('scroll', this.onWindowScroll);
  }
  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onWindowScroll);
  }

  onWindowScroll = (): void => {
    if (this.scrollTopButton) {
      this.scrollTopButton.nativeElement.style.display = window.scrollY > 300? 'block' : 'none';
    }
  };

  GoToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }  
}
