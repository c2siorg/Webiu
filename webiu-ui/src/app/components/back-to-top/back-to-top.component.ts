import { Component, ChangeDetectorRef, inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  templateUrl: './back-to-top.component.html',
  styleUrls: ['./back-to-top.component.scss'],
})
export class BackToTopComponent implements OnInit, OnDestroy {
  showButton = false;
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private routerSub!: Subscription;
  private isBrowser = false;

  ngOnInit() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      window.addEventListener('scroll', this.onWindowScroll, true); // true captures scroll events from any scrollable child if needed

      this.routerSub = this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        // Hide button and reset scroll on route change
        this.showButton = false;
        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); // Reset to top
      });
    }
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      window.removeEventListener('scroll', this.onWindowScroll, true);
    }
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  onWindowScroll = () => {
    if (!this.isBrowser) return;

    // Check various scrolling elements to ensure reliable detection
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const isScrolled = scrollPosition > 100;
    if (this.showButton !== isScrolled) {
      this.showButton = isScrolled;
      this.cdr.detectChanges(); // Force immediate update
    }
  };

  scrollToTop() {
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
