import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProjectCacheService } from './project-cache.service';
import { environment } from '../../environments/environment';

describe('ProjectCacheService', () => {
    let service: ProjectCacheService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ProjectCacheService]
        });
        service = TestBed.inject(ProjectCacheService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch projects', () => {
        const mockResponse: any = { repositories: [], total: 0, page: 1, limit: 10 };
        service.getProjects(1, 10).subscribe(response => {
            expect(response).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${environment.serverUrl}/api/v1/projects?page=1&limit=10`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });
});
