import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationsCardComponent } from './publications-card.component';

describe('PublicationsCardComponent', () => {
  let component: PublicationsCardComponent;
  let fixture: ComponentFixture<PublicationsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationsCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PublicationsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
