import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
  PLATFORM_ID,
  DestroyRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectCacheService } from '../../services/project-cache.service';
import { Project } from '../../page/projects/project.model';
import { SearchService } from '../../services/search.service';
import { getLanguageColor } from '../../common/utils/language-colors';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-spotlight-search',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (isOpen) {
      <div class="spotlight-overlay" (click)="closeSearch()" (keydown.escape)="closeSearch()" tabindex="0" role="button" aria-label="Close search overlay">
        <div class="spotlight-modal" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="-1">
          <!-- Search Header -->
          <div class="spotlight-header">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              #searchInput
              type="text"
              placeholder="Search projects by name, description, topics..."
              (input)="onSearchInput($event)"
              (keydown)="onInputKeyDown($event)"
            />
            <span class="close-badge">ESC</span>
          </div>

          <!-- Search Results -->
          @if (results.length > 0) {
            <div class="spotlight-results">
              @for (project of results; track project.name; let i = $index) {
                <div
                  class="spotlight-item"
                  [class.active]="i === selectedIndex"
                  (click)="selectProject(project)"
                  (keydown.enter)="selectProject(project)"
                  (mouseenter)="selectedIndex = i"
                  tabindex="0"
                  role="button"
                >
                  <div class="item-meta">
                    <span class="lang-dot" [style.background-color]="getLanguageColor(project.language || '')"></span>
                    <span class="item-name">{{ project.name }}</span>
                  </div>
                  <p class="item-desc">{{ project.description | slice:0:110 }}{{ (project.description && project.description.length > 110) ? '...' : '' }}</p>
                </div>
              }
            </div>
          } @else {
            <div class="spotlight-empty">
              @if (query.trim().length > 0) {
                <p>No projects found for "{{ query }}"</p>
              } @else {
                <p>Type to search C2SI projects...</p>
              }
            </div>
          }

          <!-- Shortcut Bar -->
          <div class="spotlight-footer">
            <span><kbd>↑↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .spotlight-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(7, 9, 13, 0.65);
        backdrop-filter: blur(12px) saturate(180%);
        -webkit-backdrop-filter: blur(12px) saturate(180%);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 14vh;
        animation: fadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      .spotlight-modal {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        width: 100%;
        max-width: 640px;
        box-shadow: var(--shadow-xl);
        overflow: hidden;
        animation: scaleIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        display: flex;
        flex-direction: column;
      }

      .spotlight-header {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border);
        gap: 12px;

        .search-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: var(--font-size-base);
          font-family: 'Geist', sans-serif;
          padding: 0;

          &::placeholder {
            color: var(--text-muted);
          }
        }

        .close-badge {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
          background: var(--surface-raised);
          border: 1px solid var(--border);
          padding: 3px 6px;
          border-radius: 4px;
          font-family: system-ui, sans-serif;
          letter-spacing: 0.05em;
        }
      }

      .spotlight-results {
        max-height: 380px;
        overflow-y: auto;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .spotlight-item {
        padding: 12px 16px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all var(--transition-fast);
        display: flex;
        flex-direction: column;
        gap: 4px;
        border: 1px solid transparent;

        .item-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lang-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .item-name {
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--text-primary);
          font-family: 'Geist', sans-serif;
        }

        .item-desc {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        &.active {
          background: var(--accent-purple-dim);
          border-color: rgba(123, 140, 255, 0.2);
          .item-name { color: var(--accent-purple); }
        }
      }

      .spotlight-empty {
        padding: 48px 24px;
        text-align: center;
        color: var(--text-muted);
        font-size: var(--font-size-sm);
        margin: 0;
      }

      .spotlight-footer {
        padding: 10px 20px;
        background: var(--surface-raised);
        border-top: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 11px;
        color: var(--text-muted);
        font-weight: 500;

        kbd {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 3px;
          padding: 1px 4px;
          font-size: 9px;
          margin-right: 2px;
          font-family: system-ui, sans-serif;
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.97) translateY(-8px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
    `,
  ],
})
export class SpotlightSearchComponent implements OnInit {
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  isOpen = false;
  query = '';
  results: Project[] = [];
  selectedIndex = 0;
  private searchSubject = new Subject<string>();
  private isBrowser: boolean;

  private projectService = inject(ProjectCacheService);
  private searchService = inject(SearchService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.searchService.isOpen$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((open) => {
        if (open) {
          this.openSearch();
        } else {
          this.closeSearch();
        }
      });

    this.searchSubject
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) => {
          if (!q.trim()) {
            return [ { repositories: [], total: 0 } ];
          }
          return this.projectService.searchProjects(q, 1, 6);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.results = res.repositories || [];
        this.selectedIndex = 0;
      });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (!this.isBrowser) return;

    // Toggle search with '/' or Ctrl+K / Cmd+K
    if (
      event.key === '/' &&
      !(event.target instanceof HTMLInputElement) &&
      !(event.target instanceof HTMLTextAreaElement)
    ) {
      event.preventDefault();
      this.searchService.open();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.searchService.toggle();
    } else if (event.key === 'Escape' && this.isOpen) {
      this.searchService.close();
    }
  }

  openSearch() {
    this.isOpen = true;
    this.query = '';
    this.results = [];
    this.selectedIndex = 0;
    if (!this.searchService.isOpen) {
      this.searchService.open();
    }
    setTimeout(() => {
      if (this.searchInputRef) {
        this.searchInputRef.nativeElement.focus();
      }
    }, 50);
  }

  closeSearch() {
    this.isOpen = false;
    if (this.searchService.isOpen) {
      this.searchService.close();
    }
  }

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.query = val;
    this.searchSubject.next(val);
  }

  onInputKeyDown(event: KeyboardEvent) {
    if (!this.isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (this.results.length > 0) {
          this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.results.length > 0) {
          this.selectedIndex =
            (this.selectedIndex - 1 + this.results.length) % this.results.length;
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (this.results[this.selectedIndex]) {
          this.selectProject(this.results[this.selectedIndex]);
        }
        break;
    }
  }

  selectProject(project: Project) {
    this.closeSearch();
    this.router.navigate(['/project', project.name]);
  }

  getLanguageColor = getLanguageColor;
}
