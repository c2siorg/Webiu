import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gsoc2024Component } from './gsoc2024.component';

describe('Gsoc2024Component', () => {
  let component: Gsoc2024Component;
  let fixture: ComponentFixture<Gsoc2024Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gsoc2024Component],
    }).compileComponents();

    fixture = TestBed.createComponent(Gsoc2024Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
