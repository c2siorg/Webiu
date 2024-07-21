import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsCardComponent } from './projects-card.component';

describe('ProjectsCardComponent', () => {
  let component: ProjectsCardComponent;
  let fixture: ComponentFixture<ProjectsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
