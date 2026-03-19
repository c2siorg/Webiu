import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectBasicInfoComponent } from './project-basic-info.component';
import { Project } from '../../page/projects/project.model';

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 1,
    node_id: 'MDEwOlJlcG9zaXRvcnkx',
    name: 'test-project',
    full_name: 'c2siorg/test-project',
    private: false,
    owner: {} as Project['owner'],
    html_url: 'https://github.com/c2siorg/test-project',
    description: 'A test project',
    fork: false,
    url: '',
    forks_url: '',
    keys_url: '',
    collaborators_url: '',
    teams_url: '',
    hooks_url: '',
    issue_events_url: '',
    events_url: '',
    assignees_url: '',
    branches_url: '',
    tags_url: '',
    blobs_url: '',
    git_tags_url: '',
    git_refs_url: '',
    trees_url: '',
    statuses_url: '',
    languages_url: '',
    stargazers_url: '',
    contributors_url: '',
    subscribers_url: '',
    subscription_url: '',
    commits_url: '',
    git_commits_url: '',
    comments_url: '',
    issue_comment_url: '',
    contents_url: '',
    compare_url: '',
    merges_url: '',
    archive_url: '',
    downloads_url: '',
    issues_url: '',
    pulls_url: '',
    milestones_url: '',
    notifications_url: '',
    labels_url: '',
    releases_url: '',
    deployments_url: '',
    created_at: '',
    updated_at: '',
    pushed_at: '',
    git_url: '',
    ssh_url: '',
    clone_url: '',
    svn_url: '',
    homepage: null,
    size: 0,
    stargazers_count: 42,
    watchers_count: 42,
    language: 'TypeScript',
    has_issues: true,
    has_projects: true,
    has_downloads: true,
    has_wiki: true,
    has_pages: false,
    has_discussions: false,
    forks_count: 10,
    mirror_url: null,
    archived: false,
    disabled: false,
    open_issues_count: 5,
    license: null,
    allow_forking: true,
    is_template: false,
    web_commit_signoff_required: false,
    topics: ['angular', 'nestjs'],
    visibility: 'public',
    forks: 10,
    open_issues: 5,
    watchers: 42,
    default_branch: 'main',
    permissions: {
      admin: false,
      maintain: false,
      push: false,
      triage: false,
      pull: true,
    },
    pull_requests: 15,
    ...overrides,
  } as Project;
}

describe('ProjectBasicInfoComponent', () => {
  let component: ProjectBasicInfoComponent;
  let fixture: ComponentFixture<ProjectBasicInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectBasicInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectBasicInfoComponent);
    component = fixture.componentInstance;
  });

  function setProject(overrides: Partial<Project> = {}): void {
    fixture.componentRef.setInput('project', makeProject(overrides));
    fixture.detectChanges();
  }

  it('should create', () => {
    setProject();
    expect(component).toBeTruthy();
  });

  it('should compute languagesList from project languages', () => {
    setProject({
      languages: { TypeScript: 60000, JavaScript: 30000, HTML: 10000 },
    });

    expect(component.languagesList.length).toBe(3);
    expect(component.languagesList[0].name).toBe('TypeScript');
    expect(component.languagesList[0].percentage).toBe(60);
    expect(component.languagesList[1].name).toBe('JavaScript');
    expect(component.languagesList[2].name).toBe('HTML');
  });

  it('should return empty array when languages is undefined', () => {
    setProject({ languages: undefined });
    expect(component.languagesList).toEqual([]);
  });

  it('should return empty array when language total is zero', () => {
    setProject({ languages: {} });
    expect(component.languagesList).toEqual([]);
  });

  it('should assign known colors to languages', () => {
    setProject({ languages: { TypeScript: 100 } });
    expect(component.languagesList[0].color).toBe('#3178C6');
  });

  it('should assign default color to unknown languages', () => {
    setProject({ languages: { Brainfuck: 100 } });
    expect(component.languagesList[0].color).toBe('#607466');
  });

  it('should sort languages by percentage descending', () => {
    setProject({
      languages: { CSS: 10000, TypeScript: 50000, HTML: 20000 },
    });

    const names = component.languagesList.map((l) => l.name);
    expect(names).toEqual(['TypeScript', 'HTML', 'CSS']);
  });

  it('should recompute languagesList when project input changes', () => {
    setProject({ languages: { TypeScript: 100 } });
    expect(component.languagesList.length).toBe(1);

    fixture.componentRef.setInput(
      'project',
      makeProject({ languages: { Python: 50, Go: 50 } }),
    );
    fixture.detectChanges();
    expect(component.languagesList.length).toBe(2);
  });

  it('should render the project name', () => {
    setProject({ name: 'Webiu' });

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h2')?.textContent).toContain('Webiu');
  });

  it('should render topics', () => {
    setProject({ topics: ['angular', 'nestjs', 'gsoc'] });

    const tags = fixture.nativeElement.querySelectorAll('.topic-tag');
    expect(tags.length).toBe(3);
  });
});
