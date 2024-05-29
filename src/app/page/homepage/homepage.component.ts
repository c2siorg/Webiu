import { Component , OnInit} from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { HomepageDetails } from '../../common/data/homepage';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
})
export class HomepageComponent {
  homepageData = HomepageDetails;

  ngOnInit(): void {

  }
}
