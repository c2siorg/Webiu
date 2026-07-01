import { Directive, ElementRef, OnInit, OnDestroy, Input, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { loadGsap } from './gsap-loader';

@Directive({
  selector: '[appParallax]',
  standalone: true,
})
export class ParallaxDirective implements OnInit, OnDestroy {
  @Input() speed = 0.2;
  @Input() mouseFactor = 0;

  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private scrollListener?: () => void;
  private mouseListener?: (e: MouseEvent) => void;

  private currentMouseX = 0;
  private currentMouseY = 0;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const nativeEl = this.el.nativeElement;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    void loadGsap().then((gsap) => {
      this.ngZone.runOutsideAngular(() => {
        if (this.speed !== 0) {
          let ticking = false;
          this.scrollListener = () => {
            if (!ticking) {
              window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                const targetY = scrollY * this.speed + this.currentMouseY;

                gsap.to(nativeEl, {
                  y: targetY,
                  duration: 0.1,
                  ease: 'none',
                  overwrite: 'auto',
                });
                ticking = false;
              });
              ticking = true;
            }
          };
          window.addEventListener('scroll', this.scrollListener, { passive: true });
        }

        if (this.mouseFactor > 0) {
          let mouseTicking = false;
          this.mouseListener = (event: MouseEvent) => {
            const clientX = event.clientX;
            const clientY = event.clientY;
            if (!mouseTicking) {
              window.requestAnimationFrame(() => {
                const width = window.innerWidth;
                const height = window.innerHeight;

                const normX = clientX / width - 0.5;
                const normY = clientY / height - 0.5;

                this.currentMouseX = -normX * this.mouseFactor;
                this.currentMouseY = -normY * this.mouseFactor;

                const scrollOffset = window.scrollY * this.speed;

                gsap.to(nativeEl, {
                  x: this.currentMouseX,
                  y: scrollOffset + this.currentMouseY,
                  duration: 0.8,
                  ease: 'power2.out',
                  overwrite: 'auto',
                });
                mouseTicking = false;
              });
              mouseTicking = true;
            }
          };
          window.addEventListener('mousemove', this.mouseListener, { passive: true });
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
    if (this.mouseListener) {
      window.removeEventListener('mousemove', this.mouseListener);
    }
  }
}
