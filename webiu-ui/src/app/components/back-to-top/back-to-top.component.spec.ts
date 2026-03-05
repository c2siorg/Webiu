import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackToTopComponent } from './back-to-top.component';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';

describe('BackToTopComponent', () => {
    let component: BackToTopComponent;
    let fixture: ComponentFixture<BackToTopComponent>;
    let mockRouter: any;

    beforeEach(async () => {
        mockRouter = {
            events: of({})
        };

        await TestBed.configureTestingModule({
            imports: [BackToTopComponent],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: PLATFORM_ID, useValue: 'browser' }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(BackToTopComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
