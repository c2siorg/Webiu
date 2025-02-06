import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';  

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],  
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  readonly currentYear: number = new Date().getFullYear();
}
