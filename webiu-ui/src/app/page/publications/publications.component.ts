import { Component } from '@angular/core';

import { PublicationsCardComponent } from '../../components/publications-card/publications-card.component';
import { publicationsData } from './publications-data';
import { RevealOnScrollDirective } from '../../shared/reveal-on-scroll.directive';

@Component({
  selector: 'app-publications',
  standalone: true,
  imports: [PublicationsCardComponent, RevealOnScrollDirective],
  templateUrl: './publications.component.html',
  styleUrls: ['./publications.component.scss'],
})
export class PublicationsComponent {
  publicationsData = publicationsData;
}
