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
import { isPlatformBrowser, CommonModule } from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'app-contributor-galaxy',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas #galaxyCanvas class="galaxy-canvas"></canvas>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 380px;
        position: relative;
        overflow: hidden;
        border-radius: var(--radius-lg);
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--border);
      }
      .galaxy-canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class ContributorGalaxyComponent implements AfterViewInit, OnDestroy {
  @ViewChild('galaxyCanvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationId = 0;
  private isBrowser: boolean;
  private observer!: IntersectionObserver;
  private isAnimating = false;

  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private galaxyGroup!: THREE.Group;
  private clock = new THREE.Clock();

  private ngZone = inject(NgZone);
  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.ngZone.runOutsideAngular(() => {
      this.initScene();

      window.addEventListener('resize', this.resizeListener, { passive: true });
      window.addEventListener('mousemove', this.mouseMoveListener, { passive: true });

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
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.mouse.targetX = (x / rect.width - 0.5) * 2;
    this.mouse.targetY = (y / rect.height - 0.5) * 2;
  };

  private resizeListener = () => {
    if (!this.isBrowser || !this.camera || !this.renderer) return;
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private initScene(): void {
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    } catch (e) {
      console.warn('WebGL is not supported or failed to initialize:', e);
      return;
    }

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    this.camera.position.z = 8;

    this.galaxyGroup = new THREE.Group();
    this.scene.add(this.galaxyGroup);

    this.createGalaxy();
  }

  private createGalaxy(): void {
    const contributorCount = 45;
    const positions: THREE.Vector3[] = [];
    const colors: THREE.Color[] = [];

    const palette = [
      new THREE.Color(0x7b8cff), // soft indigo
      new THREE.Color(0xc8ff4d), // neon moss
      new THREE.Color(0xff7d61), // coral
    ];

    // Generate contributor nodes in a spiral galaxy formation
    for (let i = 0; i < contributorCount; i++) {
      const angle = (i / contributorCount) * Math.PI * 4;
      const radius = 0.5 + (i / contributorCount) * 2.8;
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.3;
      const y = (Math.random() - 0.5) * 0.4;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.3;

      const pos = new THREE.Vector3(x, y, z);
      positions.push(pos);

      // Sphere geometry for each contributor node
      const size = 0.05 + Math.random() * 0.06;
      const geo = new THREE.SphereGeometry(size, 8, 8);
      const color = palette[i % palette.length];
      colors.push(color);

      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
      });

      const sphere = new THREE.Mesh(geo, mat);
      sphere.position.copy(pos);
      this.galaxyGroup.add(sphere);
    }

    // Connect nodes based on contribution distance (collaboration network lines)
    const linePositions: number[] = [];
    const lineColors: number[] = [];

    for (let i = 0; i < contributorCount; i++) {
      for (let j = i + 1; j < contributorCount; j++) {
        const dist = positions[i].distanceTo(positions[j]);
        if (dist < 1.6) {
          linePositions.push(positions[i].x, positions[i].y, positions[i].z);
          linePositions.push(positions[j].x, positions[j].y, positions[j].z);

          const colI = colors[i];
          const colJ = colors[j];
          lineColors.push(colI.r, colI.g, colI.b);
          lineColors.push(colJ.r, colJ.g, colJ.b);
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(lineGeo, lineMat);
    this.galaxyGroup.add(lines);
  }

  private animate = (): void => {
    if (!this.isAnimating || !this.renderer || !this.scene || !this.camera) return;
    this.animationId = requestAnimationFrame(this.animate);

    const elapsed = this.clock.getElapsedTime();

    // Mouse movement response
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Slow rotation of entire galaxy
    this.galaxyGroup.rotation.y = elapsed * 0.05 + this.mouse.x * 0.4;
    this.galaxyGroup.rotation.x = Math.sin(elapsed * 0.1) * 0.15 + this.mouse.y * 0.3;

    // Subtle breathing pulse for glowing meshes
    this.galaxyGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.7 + Math.sin(elapsed * 2 + child.position.x) * 0.25;
      }
    });

    this.renderer.render(this.scene, this.camera);
  };
}
