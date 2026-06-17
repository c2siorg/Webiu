import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SettingsService } from './services/settings.service';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  const mockSettingsService = {
    getPublicSettings: () => of({
      success: true,
      settings: {
        'gsoc.current_year': 2026,
        'gsoc.show_ideas_page': true,
        'site.title': 'WebiU',
        'site.description': 'WebiU - GSOC Portal',
        'site.maintenance_mode': false
      }
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        RouterTestingModule.withRoutes([]),
        NavbarComponent,
      ], // Import NavbarComponent directly
      providers: [
        { provide: SettingsService, useValue: mockSettingsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should render the navbar component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navbar')).toBeTruthy();
  });

  it('should contain router outlet', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
