import { Component, HostListener } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { gsocData } from '../../common/data/gsoc';


@Component({
  selector: 'app-gsoc',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './gsoc.component.html',
  styleUrl: './gsoc.component.scss',
})
export class GsocComponent {
  gsocData = gsocData;
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
