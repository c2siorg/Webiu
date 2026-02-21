import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-skeleton-loader',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './skeleton-loader.component.html',
    styleUrls: ['./skeleton-loader.component.scss']
})
export class SkeletonLoaderComponent {
    @Input() type: 'card' | 'profile' | 'project' | 'text' | 'circle' | 'rectangle' | 'homepage' = 'card';
    @Input() count = 1;
    @Input() width = '100%';
    @Input() height = '20px';
    @Input() borderRadius = '4px';

    get items(): number[] {
        return Array(this.count).fill(0);
    }
}
