import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let authService: AuthService;
  let settingsService: SettingsService;
  let router: Router;
  let toastr: ToastrService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent, RouterTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: {
            logout: jasmine.createSpy().and.returnValue(of({ success: true })),
          },
        },
        {
          provide: SettingsService,
          useValue: {
            getSettings: jasmine.createSpy().and.returnValue(of({
              success: true,
              settings: {
                'gsoc.current_year': '2026',
                'gsoc.show_ideas_page': 'true',
                'gsoc.registration_open': 'true',
                'site.maintenance_mode': 'false',
              },
            })),
            getDashboardSummary: jasmine.createSpy().and.returnValue(of({
              repositories: 27,
              contributors: 1582,
              programs: 4,
              ideas: 18,
              mentors: 11,
              publishedIdeas: 12,
              draftIdeas: 6,
              maintenanceMode: false,
              activeGsocYear: 2026,
              showIdeasPage: true,
              registrationOpen: true,
              lastRepositorySync: new Date('2026-06-29T00:00:00Z'),
              syncHealth: 'Healthy',
              environment: 'test',
              recentAuditEvents: [],
            })),
            syncRepositories: jasmine.createSpy().and.returnValue(of({
              message: 'Repositories synchronized successfully.',
            })),
          },
        },
        {
          provide: ToastrService,
          useValue: {
            success: jasmine.createSpy(),
            info: jasmine.createSpy(),
            error: jasmine.createSpy(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    settingsService = TestBed.inject(SettingsService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    toastr = TestBed.inject(ToastrService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load settings on init', () => {
    expect(settingsService.getDashboardSummary).toHaveBeenCalled();
    expect(component.currentYear).toBe(2026);
    expect(component.showIdeasPage).toBe(true);
    expect(component.registrationOpen).toBe(true);
    expect(component.maintenanceMode).toBe(false);
  });

  it('should call authService.logout and navigate on logout success', () => {
    component.onLogout();
    expect(authService.logout).toHaveBeenCalled();
    expect(toastr.success).toHaveBeenCalledWith('Logged out successfully');
    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('should handle logout errors gracefully', () => {
    (authService.logout as jasmine.Spy).and.returnValue(throwError(() => new Error('Error')));
    component.onLogout();
    expect(toastr.error).toHaveBeenCalledWith('Logout failed, please try again');
  });

  it('should call onSync and handle sync success', () => {
    component.onSync();
    expect(toastr.info).toHaveBeenCalledWith('Starting manual repository synchronization...', 'Sync Started');
    expect(settingsService.syncRepositories).toHaveBeenCalled();
    expect(toastr.success).toHaveBeenCalledWith('Repositories synchronized successfully.');
    expect(component.isSyncing).toBe(false);
  });

  it('should handle sync errors gracefully', () => {
    (settingsService.syncRepositories as jasmine.Spy).and.returnValue(throwError(() => ({
      error: { message: 'Failed to sync' },
    })));
    component.onSync();
    expect(toastr.error).toHaveBeenCalledWith('Failed to sync');
    expect(component.isSyncing).toBe(false);
  });
});
