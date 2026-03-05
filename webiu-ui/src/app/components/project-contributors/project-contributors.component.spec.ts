import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectContributorsComponent } from './project-contributors.component';
import { ProjectCacheService } from '../../services/project-cache.service';
import { of } from 'rxjs';

describe('ProjectContributorsComponent', () => {
    let component: ProjectContributorsComponent;
    let fixture: ComponentFixture<ProjectContributorsComponent>;
    let mockProjectService: any;

    beforeEach(async () => {
        mockProjectService = {
            getProjectContributors: jasmine.createSpy('getProjectContributors').and.returnValue(of([]))
        };

        await TestBed.configureTestingModule({
            imports: [ProjectContributorsComponent],
            providers: [
                { provide: ProjectCacheService, useValue: mockProjectService }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ProjectContributorsComponent);
        component = fixture.componentInstance;
        component.projectName = 'test-project';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
