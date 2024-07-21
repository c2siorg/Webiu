import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GsocProjectIdeaComponent } from './gsoc-project-idea.component';

describe('GsocProjectIdeaComponent', () => {
  let component: GsocProjectIdeaComponent;
  let fixture: ComponentFixture<GsocProjectIdeaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GsocProjectIdeaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GsocProjectIdeaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
