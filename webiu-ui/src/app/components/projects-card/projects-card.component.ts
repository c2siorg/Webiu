import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-projects-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects-card.component.html',
  styleUrl: './projects-card.component.scss',
})
export class ProjectsCardComponent {
  @Input() name!: string;
  @Input() description!: any;
  @Input() issue!: number;
  @Input() link!: string;
  @Input() language!: string;
  @Input() topics!: string[];
  @Input() createdAt!: string;
  @Input() updatedAt!: string;

  public detailsVisible: boolean = false;

  toggleDetails() {
    this.detailsVisible = !this.detailsVisible;
  }

  get truncatedDescription() {
    return this.description.length > 100
      ? `${this.description.slice(0, 100)}...`
      : this.description;
  }

  randomColor(): string {
    const colors = [
      '#F1E05A;',
      '#99582A',
      '#007EA7',
      '#CBFF4D',
      '#607466',
      '#F06543',
      '#F7AF9D',
      '#293241',
      '#9A48D0',
    ];
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  }
}
