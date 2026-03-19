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

  private deduplicatePublications(
    data: { heading: string; link: string; issued_by: string; description: string }[]
  ) {
    const seen = new Set<string>();
    return data.filter((pub) => {
      if (seen.has(pub.link)) return false;
      seen.add(pub.link);
      return true;
    });
  }
}