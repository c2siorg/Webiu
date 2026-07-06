import { Directive, ElementRef, OnInit, OnDestroy, Input, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { loadGsap } from './gsap-loader';

@Directive({
  selector: '[appCountUp]',
  standalone: true,
})
export class CountUpDirective implements OnInit, OnDestroy {
  @Input('appCountUp') targetValue: string | number = '';
  @Input() duration = 2.0;

  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private observer?: IntersectionObserver;
  private activeTween?: any;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const nativeEl = this.el.nativeElement;
    const rawVal = String(this.targetValue || nativeEl.textContent || '').trim();

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      nativeEl.textContent = rawVal;
      return;
    }

    const match = rawVal.match(/(\d+)/);
    if (!match) {
      nativeEl.textContent = rawVal;
      return;
    }

    const numericVal = parseInt(match[0], 10);
    const prefix = rawVal.substring(0, match.index);
    const suffix = rawVal.substring(match.index! + match[0].length);

    nativeEl.textContent = rawVal;

    void loadGsap().then((gsap) => {
      this.ngZone.runOutsideAngular(() => {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const counter = { val: 0 };
                this.activeTween = gsap.to(counter, {
                  val: numericVal,
                  duration: this.duration,
                  ease: 'power2.out',
                  onUpdate: () => {
                    nativeEl.textContent = `${prefix}${Math.floor(counter.val)}${suffix}`;
                  },
                  onComplete: () => {
                    nativeEl.textContent = rawVal;
                  },
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
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.activeTween) {
      this.activeTween.kill();
    }
  }
}
