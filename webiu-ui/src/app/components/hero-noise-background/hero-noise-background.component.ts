import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-hero-noise-background',
  standalone: true,
  imports: [],
  template: `<canvas #noiseCanvas class="noise-canvas"></canvas>`,
  styles: [
    `
      :host {
        display: block;
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 2;
        overflow: hidden;
      }
      .noise-canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class HeroNoiseBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('noiseCanvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationId = 0;
  private isBrowser: boolean;
  private observer!: IntersectionObserver;
  private isAnimating = false;

  // Interactivity and animation states
  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private clock = new THREE.Clock();
  private frameCount = 0;
  private lastThemeState: boolean | null = null;

  // 3D Objects
  private plane!: THREE.Mesh;
  private material!: THREE.MeshStandardMaterial;
  private simplex = new SimplexNoise();
  private initialX!: Float32Array;
  private initialY!: Float32Array;

  // Lights
  private ambientLight!: THREE.AmbientLight;
  private light1!: THREE.PointLight;
  private light2!: THREE.PointLight;
  private light3!: THREE.PointLight;
  private light4!: THREE.PointLight;

  private ngZone = inject(NgZone);
  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private themeService = inject(ThemeService);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.initScene();

      window.addEventListener('resize', this.resizeListener, { passive: true });
      window.addEventListener('mousemove', this.mouseMoveListener, { passive: true });

      // Pause rendering when not visible to preserve device performance
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (!this.isAnimating) {
                this.isAnimating = true;
                this.animate();
              }
            } else {
              if (this.isAnimating) {
                this.isAnimating = false;
                if (this.animationId) {
                  cancelAnimationFrame(this.animationId);
                  this.animationId = 0;
                }
              }
            }
          });
        },
        { threshold: 0.05 }
      );

      this.observer.observe(this.el.nativeElement);
    });
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('resize', this.resizeListener);
      window.removeEventListener('mousemove', this.mouseMoveListener);
      if (this.observer) {
        this.observer.disconnect();
      }
    }
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private mouseMoveListener = (event: MouseEvent) => {
    if (!this.isBrowser) return;
    this.mouse.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
    this.mouse.targetY = (event.clientY / window.innerHeight - 0.5) * 2;
  };

  private resizeListener = () => {
    if (!this.isBrowser || !this.camera || !this.renderer) return;
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private initScene(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;

    // 1. Setup WebGL Renderer with transparency
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.setClearColor(0x000000, 0);
    } catch (e) {
      console.warn('WebGL not supported or failed to initialize:', e);
      return;
    }

    // 2. Create Scene & Camera
    this.scene = new THREE.Scene();
    
    // Setup matching theme fog to blend the horizon edges away
    this.scene.fog = new THREE.FogExp2(0x000000, 0.012);

    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    this.camera.position.set(0, 0, 70);

    // 3. Create the Terrain Plane Grid
    // 120x120 segments provides ultra-high resolution for perfectly smooth, curved waves
    const geometry = new THREE.PlaneGeometry(160, 160, 120, 120);

    // Standard material with roughness and metalness matching the CodePen
    this.material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    this.plane = new THREE.Mesh(geometry, this.material);
    // Tilt the plane slightly towards the camera and lower its base Y position
    this.plane.rotation.x = -Math.PI / 2.3;
    this.plane.position.set(0, -10, 0); // Raised slightly to fill bottom half of viewport
    this.scene.add(this.plane);

    // Cache initial coordinates for direct array updates in the animation loop
    const positionAttribute = this.plane.geometry.attributes['position'];
    const count = positionAttribute.count;
    this.initialX = new Float32Array(count);
    this.initialY = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      this.initialX[i] = positionAttribute.getX(i);
      this.initialY[i] = positionAttribute.getY(i);
    }

    // 4. Add Shifting Point Lights
    const dMax = 120;
    const baseIntensity = 2.2;

    this.ambientLight = new THREE.AmbientLight(0x000000, 0.5);
    this.scene.add(this.ambientLight);

    // Four point lights located around the borders (Z set to 40 to bring them closer to the plane for intense color highlights)
    this.light1 = new THREE.PointLight(0x0e09dc, baseIntensity, dMax);
    this.light1.position.set(0, 40, 40);
    this.scene.add(this.light1);

    this.light2 = new THREE.PointLight(0x1cd1e1, baseIntensity, dMax);
    this.light2.position.set(40, 0, 40);
    this.scene.add(this.light2);

    this.light3 = new THREE.PointLight(0x18c02c, baseIntensity, dMax);
    this.light3.position.set(-40, 0, 40);
    this.scene.add(this.light3);

    this.light4 = new THREE.PointLight(0xee3bcf, baseIntensity, dMax);
    this.light4.position.set(0, -40, 40);
    this.scene.add(this.light4);

    // Initialize theme-dependent colors
    this.updateThemeColors(true);
  }

  /**
   * Reads target theme from ThemeService and adapts light/fog colors
   */
  private updateThemeColors(force = false): void {
    const isDark = this.themeService.isDarkMode();
    if (this.lastThemeState === isDark && !force) return;
    this.lastThemeState = isDark;

    // Dynamically retrieve current background style color from the DOM
    const computedStyle = getComputedStyle(document.documentElement);
    const bgColorStr = computedStyle.getPropertyValue('--bg').trim();
    const parsedBgColor = bgColorStr || (isDark ? '#07090d' : '#f7f7f2');

    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setStyle(parsedBgColor);
      this.scene.fog.density = isDark ? 0.011 : 0.012; // Adjusted dark mode fog density to create distinct silhouette layers
    }

    if (isDark) {
      // Dark Mode: Rich purple ambient base to create distinct silhouette layers in shades of purple
      this.ambientLight.color.setHex(0x4c1d95); // Vibrant purple base (purple-900)
      this.ambientLight.intensity = 1.5;       // Raised to make the different shades of purple highly visible

      this.light1.color.setHex(0x3b82f6); // Vibrant Blue
      this.light2.color.setHex(0x06b6d4); // Vibrant Cyan
      this.light3.color.setHex(0x10b981); // Vibrant Green
      this.light4.color.setHex(0xd946ef); // Vibrant Pink
      
      this.light1.intensity = 16.0;       // Bright neon foreground peaks
      this.light2.intensity = 16.0;
      this.light3.intensity = 16.0;
      this.light4.intensity = 16.0;

      this.light1.distance = 110;          // Localized decay to separate foreground, middle ground, and background
      this.light2.distance = 110;
      this.light3.distance = 110;
      this.light4.distance = 110;

      this.material.roughness = 0.4;
      this.material.metalness = 0.1;
    } else {
      // Light Mode: Clean white backdrop & light pastel colors
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 1.4;

      this.light1.color.setHex(0xb19ffb); // Pastel lavender
      this.light2.color.setHex(0x94c5ff); // Pastel sky blue
      this.light3.color.setHex(0xa2f5cb); // Pastel mint green
      this.light4.color.setHex(0xffb8d1); // Pastel rose pink

      this.light1.intensity = 2.2;
      this.light2.intensity = 2.2;
      this.light3.intensity = 2.2;
      this.light4.intensity = 2.2;

      this.light1.distance = 120;
      this.light2.distance = 120;
      this.light3.distance = 120;
      this.light4.distance = 120;

      this.material.roughness = 0.4;
      this.material.metalness = 0.1;
    }
  }

  private animate = (): void => {
    if (!this.isAnimating || !this.renderer || !this.scene || !this.camera) return;
    this.animationId = requestAnimationFrame(this.animate);

    const elapsed = this.clock.getElapsedTime();
    const time = elapsed * 0.4; // Time speed multiplier

    // 1. Periodically check and apply theme changes (every 30 frames)
    if (this.frameCount % 30 === 0) {
      this.updateThemeColors();
    }
    this.frameCount++;

    // 2. Mouse ease interpolation for subtle parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Apply interactive tilt
    this.plane.rotation.y = this.mouse.x * 0.08;
    this.plane.rotation.x = -Math.PI / 2.3 + this.mouse.y * 0.05;

    // 3. Animate vertices using Simplex Noise
    const positionAttribute = this.plane.geometry.attributes['position'];
    const xyCoef = 36; // controls noise frequency (larger value = wider, smoother, more curved waves)
    const zCoef = 9;   // controls wave amplitude height (lower value = less pointy peaks)

    const count = positionAttribute.count;
    const array = positionAttribute.array as Float32Array;
    const initialX = this.initialX;
    const initialY = this.initialY;
    const simplex = this.simplex;
    const timeFactor = time * 0.5;

    for (let i = 0; i < count; i++) {
      const x = initialX[i];
      const y = initialY[i];

      // Compute smooth undulating wave height with clamped sine mapping for perfectly round peaks
      const noiseVal = Math.max(-1, Math.min(1, simplex.noise2D(
        x / xyCoef,
        y / xyCoef + timeFactor
      )));
      const z = Math.sin(noiseVal * Math.PI / 2) * zCoef;

      array[i * 3 + 2] = z;
    }

    positionAttribute.needsUpdate = true;
    this.plane.geometry.computeVertexNormals();

    // 4. Orbit point lights above the tilted terrain (with vertical offset Y = 20)
    const orbitRadius = 40;
    const yOffset = 20;
    this.light1.position.x = Math.sin(time) * orbitRadius;
    this.light1.position.y = yOffset + Math.cos(time * 0.8) * orbitRadius;

    this.light2.position.x = Math.cos(time * 0.7) * orbitRadius;
    this.light2.position.y = yOffset + Math.sin(time * 1.2) * orbitRadius;

    this.light3.position.x = Math.sin(time * 1.1) * orbitRadius;
    this.light3.position.y = yOffset + Math.cos(time * 0.9) * orbitRadius;

    this.light4.position.x = Math.cos(time * 1.3) * orbitRadius;
    this.light4.position.y = yOffset + Math.sin(time * 0.6) * orbitRadius;

    this.renderer.render(this.scene, this.camera);
  };
}

/**
 * Self-contained 2D Simplex Noise generator in TypeScript
 */
class SimplexNoise {
  private grad3 = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
  ];
  private perm: number[] = new Array(512);
  private permMod12: number[] = new Array(512);

  constructor() {
    const p = [
      151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36,
      103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75,
      0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149,
      56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27,
      166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41,
      55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76,
      132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 189, 142, 1, 244,
      254, 150, 250, 22, 12, 191, 240, 28, 85, 158, 146, 97, 225, 22, 30, 99, 8, 156,
      21, 4, 26, 203, 85, 3, 101, 242, 193, 124, 195, 101, 110, 42, 91, 240, 249, 34,
      244, 255, 253, 251, 153, 252, 201, 143, 110, 224, 13, 44, 193, 86, 181, 36, 72,
      61, 90, 150, 37, 111, 102, 104, 18, 215, 211, 173, 57, 198, 124, 4, 201, 170,
      181, 205, 49, 38, 18, 225, 246, 17, 230, 190, 32, 10, 29, 191, 219, 54, 46, 45,
      127, 98, 33, 79, 28, 44, 224, 216, 179, 182, 37, 239, 176, 113, 224, 232, 178,
      185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191,
      179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199,
      106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205,
      93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
    ];

    for (let i = 0; i < 256; i++) {
      this.perm[i] = this.perm[i + 256] = p[i];
      this.permMod12[i] = this.permMod12[i + 256] = p[i] % 12;
    }
  }

  public noise2D(xin: number, yin: number): number {
    let n0 = 0, n1 = 0, n2 = 0;
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;

    let i1: number, j1: number;
    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;

    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) n0 = 0.0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * (this.grad3[gi0][0] * x0 + this.grad3[gi0][1] * y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) n1 = 0.0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * (this.grad3[gi1][0] * x1 + this.grad3[gi1][1] * y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) n2 = 0.0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * (this.grad3[gi2][0] * x2 + this.grad3[gi2][1] * y2);
    }

    return 70.0 * (n0 + n1 + n2);
  }
}
