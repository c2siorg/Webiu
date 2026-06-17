import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GsocComponent } from './gsoc.component';
import { SettingsService } from '../../services/settings.service';
import { of } from 'rxjs';

describe('GsocComponent', () => {
  let component: GsocComponent;
  let fixture: ComponentFixture<GsocComponent>;

  const mockSettingsService = {
    getPublicSettings: () => of({
      success: true,
      settings: {
        'gsoc.current_year': 2026,
        'gsoc.show_ideas_page': true,
      }
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GsocComponent],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GsocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
