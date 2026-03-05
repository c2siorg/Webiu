import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OpportunitiesComponent } from './opportunities.component';

describe('OpportunitiesComponent', () => {
    let component: OpportunitiesComponent;
    let fixture: ComponentFixture<OpportunitiesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OpportunitiesComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(OpportunitiesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
