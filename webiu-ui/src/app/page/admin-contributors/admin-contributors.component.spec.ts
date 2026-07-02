import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AdminContributorsComponent } from './admin-contributors.component';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';

describe('AdminContributorsComponent', () => {
  let component: AdminContributorsComponent;
  let fixture: ComponentFixture<AdminContributorsComponent>;
  let authService: AuthService;
  let settingsService: SettingsService;
  let router: Router;
  let toastr: ToastrService;

  const mockAnalyticsData = {
    metrics: {
      totalContributors: 5,
      activeRepositories: 3,
      averageContributorsPerRepo: 2,
      averageContributionsPerContributor: 30,
      topContributorContributionCount: 80,
      largestRepositoryCommunity: 4,
    },
    leaderboard: [
      { id: '1', username: 'alice', avatarUrl: 'avatar-alice', profileUrl: 'url-alice', totalContributions: 80, repoCount: 2, repos: ['Webiu'] },
      { id: '2', username: 'bob', avatarUrl: 'avatar-bob', profileUrl: 'url-bob', totalContributions: 60, repoCount: 3, repos: ['Webiu'] },
    ],
    repositoryParticipation: [
      { name: 'Webiu', contributorCount: 4 },
      { name: 'OpenHealthStack', contributorCount: 2 },
    ],
    contributionDistribution: [
      { range: '1-10', count: 1 },
      { range: '11-50', count: 0 },
      { range: '51-100', count: 2 },
      { range: '100+', count: 0 },
    ],
    communityInsights: {
      mostActiveContributor: { username: 'alice', avatarUrl: 'avatar-alice', profileUrl: 'url-alice', totalContributions: 80, repoCount: 2 },
      largestCommunityRepo: { name: 'Webiu', contributorCount: 4 },
      highestAverageContributionsRepo: { name: 'Webiu', avgContributions: 37.5 },
      crossRepoContributor: { username: 'bob', avatarUrl: 'avatar-bob', profileUrl: 'url-bob', repoCount: 3, totalContributions: 60 },
    },
    explorer: [
      { id: '1', username: 'alice', avatarUrl: 'avatar-alice', profileUrl: 'url-alice', totalContributions: 80, repoCount: 2, repos: ['Webiu', 'OpenHealthStack'] },
      { id: '2', username: 'bob', avatarUrl: 'avatar-bob', profileUrl: 'url-bob', totalContributions: 60, repoCount: 3, repos: ['Webiu', 'OpenHealthStack'] },
    ],
    recentContributors: [
      { id: '1', username: 'alice', avatarUrl: 'avatar-alice', profileUrl: 'url-alice', createdAt: new Date() },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminContributorsComponent, RouterTestingModule],
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
            getContributorAnalytics: jasmine.createSpy().and.returnValue(of(mockAnalyticsData)),
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

    fixture = TestBed.createComponent(AdminContributorsComponent);
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

  it('should load analytics on init', () => {
    expect(settingsService.getContributorAnalytics).toHaveBeenCalled();
    expect(component.analyticsData).toBeDefined();
    expect(component.analyticsData.metrics.totalContributors).toBe(5);
    expect(component.isLoading).toBe(false);
  });

  it('should handle analytics load errors gracefully', () => {
    (settingsService.getContributorAnalytics as jasmine.Spy).and.returnValue(throwError(() => new Error('Error')));
    component.loadAnalyticsData();
    expect(component.hasError).toBe(true);
    expect(toastr.error).toHaveBeenCalledWith('Failed to load contributor intelligence analytics.');
  });

  it('should filter explorer list based on search text', () => {
    component.searchText = 'bob';
    const filtered = component.filteredContributors;
    expect(filtered.length).toBe(1);
    expect(filtered[0].username).toBe('bob');
  });

  it('should sort explorer list correctly', () => {
    // default sort by username ascending: alice then bob
    let list = component.filteredContributors;
    expect(list[0].username).toBe('alice');

    // change sort to totalContributions descending
    component.onSort('totalContributions');
    component.sortAscending = false;
    list = component.filteredContributors;
    expect(list[0].username).toBe('alice'); // alice has 80, bob has 60

    // change sort to totalContributions ascending
    component.sortAscending = true;
    list = component.filteredContributors;
    expect(list[0].username).toBe('bob'); // bob has 60, alice has 80
  });

  it('should support pagination correctly', () => {
    component.pageSize = 1;
    expect(component.totalExplorerPages).toBe(2);
    expect(component.paginatedContributors.length).toBe(1);
    expect(component.paginatedContributors[0].username).toBe('alice');

    component.onPageChange(2);
    expect(component.currentPage).toBe(2);
    expect(component.paginatedContributors[0].username).toBe('bob');
  });

  it('should call authService.logout and navigate on logout success', () => {
    component.onLogout();
    expect(authService.logout).toHaveBeenCalled();
    expect(toastr.success).toHaveBeenCalledWith('Logged out successfully');
    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
  });
});
