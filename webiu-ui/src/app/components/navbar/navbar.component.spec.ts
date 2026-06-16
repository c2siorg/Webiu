import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NavbarComponent } from './navbar.component';
import { SettingsService } from '../../services/settings.service';
import { of } from 'rxjs';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

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
      imports: [NavbarComponent, RouterTestingModule],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
