import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpportunitiesData } from '../../common/data/opportunities';

@Component({
  selector: 'app-opportunities',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './opportunities.component.html',
  styleUrl: './opportunities.component.scss'
})
export class OpportunitiesComponent {
  data = OpportunitiesData;
}