import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileCardComponent } from './profile-card.component';

describe('ProfileCardComponent', () => {
    let component: ProfileCardComponent;
    let fixture: ComponentFixture<ProfileCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProfileCardComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ProfileCardComponent);
        component = fixture.componentInstance;
        // Set required inputs
        component.login = 'testuser';
        component.repos = [];
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
