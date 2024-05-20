import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-contributors',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './contributors.component.html',
  styleUrl: './contributors.component.scss',
})
export class ContributorsComponent {}
