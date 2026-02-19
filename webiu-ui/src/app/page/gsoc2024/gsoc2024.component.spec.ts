import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GsocComponent } from './gsoc.component';

describe('GsocComponent', () => {
  let component: GsocComponent;
  let fixture: ComponentFixture<GsocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GsocComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GsocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
