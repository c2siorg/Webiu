import { Component, OnInit, inject } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { gsocData } from '../../common/data/gsoc';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-gsoc',
  standalone: true,
  imports: [NavbarComponent, CommonModule],
  templateUrl: './gsoc.component.html',
  styleUrl: './gsoc.component.scss',
})
export class GsocComponent implements OnInit {
  private settingsService = inject(SettingsService);

  gsocData = gsocData;
  activeProjectIndex: number | null = null;
  currentYear = 2026;

  ngOnInit(): void {
    this.settingsService.getPublicSettings().subscribe({
      next: (res) => {
        if (res?.success && res?.settings) {
          this.currentYear = Number(res.settings['gsoc.current_year']) || 2026;
        }
      },
      error: () => {
        this.currentYear = 2026;
      }
    });
  }

  toggleAccordion(index: number): void {
    if (this.activeProjectIndex === index) {
      this.activeProjectIndex = null;
    } else {
      this.activeProjectIndex = index;
    }
  }
}
