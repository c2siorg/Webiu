import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { PublicationsCardComponent } from '../../components/publications-card/publications-card.component';
import publicationsData from './publications-data.json';

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
  publications: Publication[] = publicationsData;

  constructor() {}

  ngOnInit(): void {
    console.log('Fetched Publications:', this.publications);
  }
}
