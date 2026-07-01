import { Directive, ElementRef, OnInit, OnDestroy, Input, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { loadGsap } from './gsap-loader';

@Directive({
  selector: '[appRevealOnScroll]',
  standalone: true,
})
export class RevealOnScrollDirective implements OnInit, OnDestroy {
  @Input() direction: 'left' | 'right' | 'center' = 'center';
  @Input() revealDelay = 0;
  @Input() duration = 0.9;
  /** When true, element stays visible for LCP — no initial opacity:0 hide */
  @Input() immediate = false;

  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private observer?: IntersectionObserver;
  private activeTween?: any;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const nativeEl = this.el.nativeElement;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || this.immediate) {
      nativeEl.style.opacity = '1';
      nativeEl.style.transform = 'none';
      return;
    }

    let xOffset = 0;
    let yOffset = 0;

    if (this.direction === 'left') {
      xOffset = -80;
    } else if (this.direction === 'right') {
      xOffset = 80;
    } else {
      yOffset = 100;
    }

    void loadGsap().then((gsap) => {
      gsap.set(nativeEl, {
        opacity: 0,
        scale: 0.95,
        x: xOffset,
        y: yOffset,
        willChange: 'transform, opacity',
      });

      this.ngZone.runOutsideAngular(() => {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.activeTween = gsap.to(nativeEl, {
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  y: 0,
                  duration: this.duration,
                  delay: this.revealDelay / 1000,
                  ease: 'power3.out',
                  overwrite: 'auto',
                  onComplete: () => {
                    nativeEl.style.willChange = 'auto';
                  },
                });
                this.observer?.unobserve(nativeEl);
              }
            });
          },
          {
            threshold: 0.05,
            rootMargin: '0px 0px -40px 0px',
          }
        );

        this.observer.observe(nativeEl);
      });
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.activeTween) {
      this.activeTween.kill();
    }
  }
}
