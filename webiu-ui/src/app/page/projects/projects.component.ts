import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ProjectsCardComponent } from '../../components/projects-card/projects-card.component';
import { projectsData } from './projects-data';

interface Project {
  name: string;
  description: string | null;
  issue: number;
  link: string;
  open_issues_count: number;
  html_url: string;
  language: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ProjectsCardComponent],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  projectsData = projectsData;

  constructor() {}

  ngOnInit(): void {}
}
