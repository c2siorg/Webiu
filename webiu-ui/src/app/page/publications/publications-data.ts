import { Component } from '@angular/core';
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
  publicationsData = this.deduplicatePublications(publicationsData);

  private deduplicatePublications(data: typeof publicationsData) {
    const seen = new Set<string>();
    return data.filter((pub) => {
      const key = pub.link;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}