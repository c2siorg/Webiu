import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Media, socialMedia } from '../../common/data/media';
import { Contributor, contributors } from '../../common/data/contributer';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss'],
})
export class CommunityComponent {
  icons: Media[] = socialMedia;
  users: Contributor[] = this.shuffleArray(contributors);
  private shuffleArray(array: any[]): any[] {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
  }
}
