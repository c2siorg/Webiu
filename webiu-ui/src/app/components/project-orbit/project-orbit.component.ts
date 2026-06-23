import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  Input,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'app-project-orbit',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas #orbitCanvas class="orbit-canvas"></canvas>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 340px;
        position: relative;
        overflow: hidden;
        border-radius: var(--radius-lg);
        background: rgba(255, 255, 255, 0.01);
        border: 1px solid var(--border);
      }
      .orbit-canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class ProjectOrbitComponent implements AfterViewInit, OnDestroy {
  @Input() projectName = 'Repository';
  @ViewChild('orbitCanvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationId = 0;
  private isBrowser: boolean;
  private observer!: IntersectionObserver;
  private isAnimating = false;

  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private orbitGroup!: THREE.Group;
  private clock = new THREE.Clock();

  // Planets
  private planets: {
    mesh: THREE.Mesh;
    angle: number;
    speed: number;
    radius: number;
  }[] = [];

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
    this.camera.position.z = 7;
    this.camera.position.y = 2.5;
    this.camera.lookAt(0, 0, 0);

    this.orbitGroup = new THREE.Group();
    this.scene.add(this.orbitGroup);

    this.createSolarSystem();
  }

  private createSolarSystem(): void {
    // 1. Center sun (Repository Core)
    const sunGeo = new THREE.IcosahedronGeometry(0.7, 1);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0x7b8cff, // Soft Indigo
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    this.orbitGroup.add(sun);

    // Mini glowing nucleus inside sun
    const coreGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xc8ff4d, // Neon Moss
      transparent: true,
      opacity: 0.9,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    this.orbitGroup.add(core);

    // 2. Orbiting items (Planets)
    const planetData = [
      { name: 'Issues', radius: 1.4, size: 0.12, color: 0xff7d61, speed: 0.8 },
      { name: 'PRs', radius: 2.1, size: 0.14, color: 0x7b8cff, speed: 0.5 },
      { name: 'Contributors', radius: 2.8, size: 0.16, color: 0xc8ff4d, speed: 0.35 },
      { name: 'Languages', radius: 3.5, size: 0.1, color: 0xffffff, speed: 0.2 },
    ];

    planetData.forEach((data, index) => {
      // Orbit Ring line
      const curve = new THREE.EllipseCurve(0, 0, data.radius, data.radius, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(64);
      const ringGeo = new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(p.x, 0, p.y))
      );
      const ringMat = new THREE.LineBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.15,
      });
      const ring = new THREE.Line(ringGeo, ringMat);
      this.orbitGroup.add(ring);

      // Planet Mesh
      const planetGeo = new THREE.SphereGeometry(data.size, 16, 16);
      const planetMat = new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.9,
      });
      const planet = new THREE.Mesh(planetGeo, planetMat);

      // Set initial angle
      const initialAngle = (index * Math.PI) / 2;
      planet.position.x = Math.cos(initialAngle) * data.radius;
      planet.position.z = Math.sin(initialAngle) * data.radius;

      this.orbitGroup.add(planet);

      this.planets.push({
        mesh: planet,
        angle: initialAngle,
        speed: data.speed,
        radius: data.radius,
      });
    });
  }

  private animate = (): void => {
    if (!this.isAnimating || !this.renderer || !this.scene || !this.camera) return;
    this.animationId = requestAnimationFrame(this.animate);

    const elapsed = this.clock.getElapsedTime();

    // Mouse movement response
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Slow rotation of central core
    const sun = this.orbitGroup.children[0] as THREE.Mesh;
    if (sun) {
      sun.rotation.y = elapsed * 0.2;
      sun.rotation.z = elapsed * 0.1;
    }

    // Pulse core scale
    const core = this.orbitGroup.children[1] as THREE.Mesh;
    if (core) {
      const s = 1 + Math.sin(elapsed * 3) * 0.08;
      core.scale.set(s, s, s);
    }

    // Rotate the entire group subtly based on mouse
    this.orbitGroup.rotation.y = this.mouse.x * 0.35;
    this.orbitGroup.rotation.x = this.mouse.y * 0.25;

    // Update orbiting planets
    this.planets.forEach((p) => {
      p.angle += p.speed * 0.015;
      p.mesh.position.x = Math.cos(p.angle) * p.radius;
      p.mesh.position.z = Math.sin(p.angle) * p.radius;

      // Pulse orbits
      if (p.mesh.material instanceof THREE.MeshBasicMaterial) {
        p.mesh.material.opacity = 0.8 + Math.sin(elapsed * 4 + p.radius) * 0.15;
      }
    });

    this.renderer.render(this.scene, this.camera);
  };
}
