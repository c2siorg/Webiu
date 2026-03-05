import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommitGraphComponent } from './commit-graph.component';

describe('CommitGraphComponent', () => {
    let component: CommitGraphComponent;
    let fixture: ComponentFixture<CommitGraphComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CommitGraphComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CommitGraphComponent);
        component = fixture.componentInstance;
        component.activity = [];
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
