import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GsocComponent } from './gsoc.component';
import { SettingsService } from '../../services/settings.service';
import { GsocService } from '../../services/gsoc.service';
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

  const mockGsocService = {
    getCurrentProgram: () => of({
      success: true,
      program: {
        id: '1',
        year: 2026,
        title: 'Google Summer of Code 2026',
        introHtml: '<p>Intro</p>',
        status: 'PUBLISHED',
        isActive: true,
        createdAt: '',
        updatedAt: ''
      }
    }),
    getCurrentIdeas: () => of({
      success: true,
      ideas: []
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GsocComponent],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: GsocService, useValue: mockGsocService }
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
