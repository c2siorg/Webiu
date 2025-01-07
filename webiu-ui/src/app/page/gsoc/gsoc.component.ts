import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { gsocData } from '../../common/data/gsoc';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gsoc',
  standalone: true,
  imports: [NavbarComponent,CommonModule],
  templateUrl: './gsoc.component.html',
  styleUrl: './gsoc.component.scss',
})
export class GsocComponent {
  gsocData = gsocData;
}
