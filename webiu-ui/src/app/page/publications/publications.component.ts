import { Component } from '@angular/core';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import { PublicationsCardComponent } from '../../components/publications-card/publications-card.component';
import { BackToTopComponent } from '../../components/back-to-top/back-to-top.component';
import { publicationsData } from './publications-data';

@Component({
  selector: 'app-publications',
  standalone: true,
  imports: [NavbarComponent, PublicationsCardComponent, BackToTopComponent],
  templateUrl: './publications.component.html',
  styleUrls: ['./publications.component.scss'],
})
export class PublicationsComponent {
  publicationsData = publicationsData;
}
