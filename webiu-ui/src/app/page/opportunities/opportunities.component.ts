import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpportunitiesData } from '../../common/data/opportunities';
import { RevealOnScrollDirective } from '../../shared/reveal-on-scroll.directive';

@Component({
  selector: 'app-opportunities',
  standalone: true,
  imports: [CommonModule, RevealOnScrollDirective],
  templateUrl: './opportunities.component.html',
  styleUrl: './opportunities.component.scss'
})
export class OpportunitiesComponent {
  data = OpportunitiesData;

  applyFor(title: string) {
    const subject = encodeURIComponent(`Application for ${title}`);
    const body = encodeURIComponent(`Hi C2SI Team,\n\nI'm interested in applying for the ${title} role. Attached is my resume.\n\nThank you!`);
    window.location.href = `mailto:research@c2si.org?subject=${subject}&body=${body}`;
  }
}