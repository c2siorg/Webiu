import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-publications-card',
  standalone: true,
  imports: [],
  templateUrl: './publications-card.component.html',
  styleUrl: './publications-card.component.scss',
})
export class PublicationsCardComponent {
  @Input() heading!: string;
  @Input() link!: string;
  @Input() issued_by!: string;
  @Input() description!: string;
}
