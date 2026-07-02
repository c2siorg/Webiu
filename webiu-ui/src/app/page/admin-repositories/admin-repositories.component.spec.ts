import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AdminRepositoriesComponent } from './admin-repositories.component';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';

describe('AdminRepositoriesComponent', () => {
  let component: AdminRepositoriesComponent;
  let fixture: ComponentFixture<AdminRepositoriesComponent>;
  let authService: AuthService;
  let settingsService: SettingsService;
  let router: Router;
  let toastr: ToastrService;

  const mockAnalyticsData = {
    metrics: {
      totalRepositories: 5,
      publicRepositories: 3,
      privateRepositories: 2,
      archivedRepositories: 1,
      totalContributors: 10,
      totalStars: 120,
      totalForks: 35,
      averageContributorsPerRepo: 3,
      averageStarsPerRepo: 24,
      averageForksPerRepo: 7,
    },
    popularRepositories: [
      { id: '1', name: 'repo-one', description: 'Repo One Desc', stars: 100, forks: 25, topics: ['typescript'], contributorCount: 8, visibility: 'public', isArchived: false, language: 'TypeScript' },
      { id: '2', name: 'repo-two', description: 'Repo Two Desc', stars: 20, forks: 10, topics: ['javascript'], contributorCount: 2, visibility: 'public', isArchived: false, language: 'JavaScript' },
    ],
    repositoryParticipation: [
      { name: 'repo-one', contributorCount: 8 },
      { name: 'repo-two', contributorCount: 2 },
    ],
    forkDistribution: [
      { name: 'repo-one', forks: 25 },
      { name: 'repo-two', forks: 10 },
    ],
    topicDistribution: [
      { topic: 'typescript', count: 1 },
      { topic: 'javascript', count: 1 },
    ],
    languageDistribution: [
      { language: 'TypeScript', count: 1 },
      { language: 'JavaScript', count: 1 },
    ],
    visibilityDistribution: {
      public: 3,
      private: 2,
      archived: 1,
    },
    communityInsights: {
      mostStarredRepo: { name: 'repo-one', stars: 100 },
      mostForkedRepo: { name: 'repo-one', forks: 25 },
      largestCommunityRepo: { name: 'repo-one', contributorCount: 8 },
      leastActiveRepo: { name: 'repo-two', contributorCount: 2 },
      archivedRepoCount: 1,
    },
    explorer: [
      { id: '1', name: 'repo-one', description: 'Repo One Desc', stars: 100, forks: 25, topics: ['typescript'], contributorCount: 8, visibility: 'public', isArchived: false, language: 'TypeScript' },
      { id: '2', name: 'repo-two', description: 'Repo Two Desc', stars: 20, forks: 10, topics: ['javascript'], contributorCount: 2, visibility: 'public', isArchived: false, language: 'JavaScript' },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRepositoriesComponent, RouterTestingModule],
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
            getRepositoryAnalytics: jasmine.createSpy().and.returnValue(of(mockAnalyticsData)),
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

    fixture = TestBed.createComponent(AdminRepositoriesComponent);
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
    expect(settingsService.getRepositoryAnalytics).toHaveBeenCalled();
    expect(component.analyticsData).toBeDefined();
    expect(component.analyticsData.metrics.totalRepositories).toBe(5);
    expect(component.isLoading).toBe(false);
  });

  it('should handle analytics load errors gracefully', () => {
    (settingsService.getRepositoryAnalytics as jasmine.Spy).and.returnValue(throwError(() => new Error('Error')));
    component.loadAnalyticsData();
    expect(component.hasError).toBe(true);
    expect(toastr.error).toHaveBeenCalledWith('Failed to load repository intelligence analytics.');
  });

  it('should filter explorer list based on search text', () => {
    component.searchText = 'repo-two';
    const filtered = component.filteredRepositories;
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('repo-two');
  });

  it('should sort explorer list correctly', () => {
    // default sort by name ascending: repo-one then repo-two
    let list = component.filteredRepositories;
    expect(list[0].name).toBe('repo-one');

    // change sort to stars descending
    component.onSort('stars');
    component.sortAscending = false;
    list = component.filteredRepositories;
    expect(list[0].name).toBe('repo-one'); // repo-one has 100, repo-two has 20

    // change sort to stars ascending
    component.sortAscending = true;
    list = component.filteredRepositories;
    expect(list[0].name).toBe('repo-two'); // repo-two has 20, repo-one has 100
  });

  it('should support pagination correctly', () => {
    component.pageSize = 1;
    expect(component.getTotalPages()).toBe(2);
    expect(component.paginatedRepositories.length).toBe(1);
    expect(component.paginatedRepositories[0].name).toBe('repo-one');

    component.onPageChange(2);
    expect(component.currentPage).toBe(2);
    expect(component.paginatedRepositories[0].name).toBe('repo-two');
  });

  it('should call authService.logout and navigate on logout success', () => {
    component.onLogout();
    expect(authService.logout).toHaveBeenCalled();
    expect(toastr.success).toHaveBeenCalledWith('Logged out successfully');
    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
  });
});
