import { Directive, ElementRef, OnInit, OnDestroy, Input, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

@Directive({
  selector: '[appRevealOnScroll]',
  standalone: true,
})
export class RevealOnScrollDirective implements OnInit, OnDestroy {
  @Input() direction: 'left' | 'right' | 'center' = 'center';
  @Input() revealDelay = 0; // delay in milliseconds
  @Input() duration = 0.9;  // duration in seconds (between 0.8s and 1.1s)

  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const nativeEl = this.el.nativeElement;

    // Check prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      nativeEl.style.opacity = '1';
      nativeEl.style.transform = 'none';
      return;
    }

    // Set initial state immediately to prevent layout flashes
    let xOffset = 0;
    let yOffset = 0;

    if (this.direction === 'left') {
      xOffset = -80;
    } else if (this.direction === 'right') {
      xOffset = 80;
    } else {
      yOffset = 100; // translateY 100px as per the new spec
    }

    gsap.set(nativeEl, {
      opacity: 0,
      scale: 0.95, // scale 0.95 as per the new spec
      x: xOffset,
      y: yOffset,
      willChange: 'transform, opacity',
    });

    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              gsap.to(nativeEl, {
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
                duration: this.duration,
                delay: this.revealDelay / 1000,
                ease: 'power3.out', // power3.out easing as per spec
                overwrite: 'auto',
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
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
