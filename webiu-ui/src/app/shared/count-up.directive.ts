import { Directive, ElementRef, OnInit, OnDestroy, Input, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

@Directive({
  selector: '[appCountUp]',
  standalone: true,
})
export class CountUpDirective implements OnInit, OnDestroy {
  @Input('appCountUp') targetValue: string | number = '';
  @Input() duration = 2.0; // duration in seconds

  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const nativeEl = this.el.nativeElement;
    const rawVal = String(this.targetValue || nativeEl.textContent || '').trim();

    // Check prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      nativeEl.textContent = rawVal;
      return;
    }

    // Extract numbers and surrounding non-numeric characters (e.g. "+", "k")
    const match = rawVal.match(/(\d+)/);
    if (!match) {
      nativeEl.textContent = rawVal;
      return;
    }

    const numericVal = parseInt(match[0], 10);
    const prefix = rawVal.substring(0, match.index);
    const suffix = rawVal.substring(match.index! + match[0].length);

    // Initial state
    nativeEl.textContent = `${prefix}0${suffix}`;

    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const counter = { val: 0 };
              gsap.to(counter, {
                val: numericVal,
                duration: this.duration,
                ease: 'power2.out',
                onUpdate: () => {
                  nativeEl.textContent = `${prefix}${Math.floor(counter.val)}${suffix}`;
                },
                onComplete: () => {
                  nativeEl.textContent = rawVal; // ensure final value is exact
                }
              });
              this.observer?.unobserve(nativeEl);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -20px 0px',
        }
      );

      this.observer.observe(nativeEl);
    });
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
