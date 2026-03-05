import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectDetailsComponent } from './project-details.component';
import { ActivatedRoute } from '@angular/router';
import { ProjectCacheService } from '../../services/project-cache.service';
import { of } from 'rxjs';

describe('ProjectDetailsComponent', () => {
    let component: ProjectDetailsComponent;
    let fixture: ComponentFixture<ProjectDetailsComponent>;
    let mockProjectService: any;
    let mockActivatedRoute: any;

    beforeEach(async () => {
        const mockProject = {
            name: 'test-project',
            owner: { login: 'test-owner' },
            stargazers_count: 0,
            forks_count: 0,
            open_issues_count: 0,
            languages: {}
        };

        const mockInsights = {
            commit_activity: [],
            badges: {
                maturity: { label: 'New', description: '' },
                maintenance: { label: 'Active', description: '' },
                complexity: { label: 'Low', description: '' },
                activity_level: { label: 'Low', description: '' }
            },
            stats: {
                age_years: 0,
                recent_commits: 0,
                release_recency: 'N/A',
                health: 'Good'
            }
        };

        mockProjectService = {
            getProjectByName: jasmine.createSpy('getProjectByName').and.returnValue(of(mockProject)),
            getProjectInsights: jasmine.createSpy('getProjectInsights').and.returnValue(of(mockInsights)),
            getProjectContributors: jasmine.createSpy('getProjectContributors').and.returnValue(of([]))
        };

        mockActivatedRoute = {
            snapshot: {
                paramMap: {
                    get: jasmine.createSpy('get').and.returnValue('test-project')
                }
            }
        };

        await TestBed.configureTestingModule({
            imports: [ProjectDetailsComponent],
            providers: [
                { provide: ProjectCacheService, useValue: mockProjectService },
                { provide: ActivatedRoute, useValue: mockActivatedRoute }
            ],
            schemas: [NO_ERRORS_SCHEMA]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ProjectDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
