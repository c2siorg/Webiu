import { Component, HostListener } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Media, socialMedia } from '../../common/data/media';
import { Contributor, contributors } from '../../common/data/contributor';
import { CommmonUtilService } from '../../common/service/commmon-util.service';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss'],
})
export class CommunityComponent {
  constructor(private commonUtil : CommmonUtilService){

  }
  icons: Media[] = socialMedia;
  users: Contributor[] = this.shuffleArray(contributors);
  showButton = false;
  private shuffleArray(array: any[]): any[] {
    let currentIndex = array.length,
      randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }

    return array;
  }
  @HostListener('window:scroll')
  onWindowScroll() {
    // Show button when user scrolls down 100px from the top
    this.showButton = window.scrollY > 100;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
