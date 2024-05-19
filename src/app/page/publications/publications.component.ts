import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-publications',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './publications.component.html',
  styleUrl: './publications.component.scss',
})
export class PublicationsComponent {}
