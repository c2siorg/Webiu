import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-gsoc',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './gsoc.component.html',
  styleUrl: './gsoc.component.scss',
})
export class GsocComponent {}
