import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectInsightsComponent } from './project-insights.component';
import { ProjectCacheService } from '../../services/project-cache.service';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ProjectInsightsComponent', () => {
    let component: ProjectInsightsComponent;
    let fixture: ComponentFixture<ProjectInsightsComponent>;
    let mockProjectService: any;

    beforeEach(async () => {
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
            getProjectInsights: jasmine.createSpy('getProjectInsights').and.returnValue(of(mockInsights))
        };

        await TestBed.configureTestingModule({
            imports: [ProjectInsightsComponent],
            providers: [
                { provide: ProjectCacheService, useValue: mockProjectService }
            ],
            schemas: [NO_ERRORS_SCHEMA]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ProjectInsightsComponent);
        component = fixture.componentInstance;
        component.projectName = 'test-project';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
