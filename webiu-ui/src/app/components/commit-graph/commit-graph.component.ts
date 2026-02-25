import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-commit-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './commit-graph.component.html',
  styleUrls: ['./commit-graph.component.scss'],
})
export class CommitGraphComponent implements OnChanges {
  @Input() activity: any[] = [];

  pathData = '';
  areaPathData = '';

  readonly width = 400;
  readonly height = 60;
  readonly padding = 2;

  ngOnChanges(): void {
    this.generatePath();
  }

  private generatePath(): void {
    if (!this.activity || this.activity.length === 0) {
      this.pathData = '';
      this.areaPathData = '';
      return;
    }

    const data = this.activity.map((week) => week.total || 0);
    const max = Math.max(...data, 1); // Avoid division by zero

    if (data.length < 2) {
      this.pathData = '';
      this.areaPathData = '';
      return;
    }

    const stepX = this.width / (data.length - 1);

    // Create points
    const points = data.map((val, i) => {
      const x = i * stepX;
      // Invert Y because SVG coordinates start from top
      const y =
        this.height -
        (val / max) * (this.height - this.padding * 2) -
        this.padding;
      return { x, y };
    });

    // Generate Cubic Bézier Path for smooth curves
    let d = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];

      // Control points for smoothness
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
    }

    this.pathData = d;

    // Generate Area Path (closing the shape for the gradient fill)
    this.areaPathData = `${d} L ${this.width},${this.height} L 0,${this.height} Z`;
  }
}
