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

@Component({
  selector: 'app-repo-intelligence-core',
  standalone: true,
  imports: [],
  template: `<canvas #threeCanvas class="intelligence-canvas"></canvas>`,
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
      .intelligence-canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class RepoIntelligenceCoreComponent implements AfterViewInit, OnDestroy {
  @ViewChild('threeCanvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationId = 0;
  private isBrowser: boolean;
  private observer!: IntersectionObserver;
  private isAnimating = false;

  // Mouse tracking
  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  // Core geometry group
  private coreGroup!: THREE.Group;

  // Orbiting particles
  private orbitParticles: THREE.Points[] = [];
  private connectionLines: THREE.LineSegments[] = [];

  // Clock
  private clock = new THREE.Clock();

  private ngZone = inject(NgZone);
  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    // Run outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => {
      this.initScene();
      
      // Bind event listeners manually outside Angular zone
      window.addEventListener('resize', this.resizeListener, { passive: true });
      window.addEventListener('mousemove', this.mouseMoveListener, { passive: true });

      // Intersection Observer to pause Three.js when scrolled out of view
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
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
      }, { threshold: 0.05 });

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

    // Renderer
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0x000000, 0);
    } catch (e) {
      console.warn('WebGL is not supported or failed to initialize:', e);
      return;
    }

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    this.camera.position.z = 6;

    // Core group — holds all geometry
    this.coreGroup = new THREE.Group();
    this.scene.add(this.coreGroup);

    this.createIcosahedronWireframe();
    this.createInnerCore();
    this.createOrbitRings();
    this.createContributorNodes();
    this.createConnectionNetwork();
  }

  /**
   * Main wireframe icosahedron — the "intelligence shell"
   */
  private createIcosahedronWireframe(): void {
    const geo = new THREE.IcosahedronGeometry(1.8, 1);
    const edgesGeo = new THREE.EdgesGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: 0x7b8cff, // accent-purple
      transparent: true,
      opacity: 0.3,
    });
    const wireframe = new THREE.LineSegments(edgesGeo, mat);
    this.coreGroup.add(wireframe);

    // Second pass — slightly larger, dimmer, counter-rotated
    const geo2 = new THREE.IcosahedronGeometry(2.2, 1);
    const edgesGeo2 = new THREE.EdgesGeometry(geo2);
    const mat2 = new THREE.LineBasicMaterial({
      color: 0xc7f464, // accent-lime
      transparent: true,
      opacity: 0.12,
    });
    const wireframe2 = new THREE.LineSegments(edgesGeo2, mat2);
    wireframe2.rotation.y = Math.PI / 5;
    wireframe2.rotation.x = Math.PI / 7;
    this.coreGroup.add(wireframe2);
  }

  /**
   * Glowing inner sphere — the "data nucleus"
   */
  private createInnerCore(): void {
    const geo = new THREE.SphereGeometry(0.4, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xc7f464,
      transparent: true,
      opacity: 0.15,
    });
    const sphere = new THREE.Mesh(geo, mat);
    this.coreGroup.add(sphere);

    // Bright center point
    const dotGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xc7f464,
      transparent: true,
      opacity: 0.9,
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    this.coreGroup.add(dot);
  }

  /**
   * Concentric orbit rings — representing activity layers
   */
  private createOrbitRings(): void {
    const ringRadii = [2.6, 3.2, 3.8];
    const ringColors = [0x7b8cff, 0xc7f464, 0xff7d61];
    const ringOpacities = [0.18, 0.12, 0.08];

    ringRadii.forEach((r, i) => {
      const curve = new THREE.EllipseCurve(0, 0, r, r, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(128);
      const geo = new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(p.x, 0, p.y))
      );
      const mat = new THREE.LineBasicMaterial({
        color: ringColors[i],
        transparent: true,
        opacity: ringOpacities[i],
      });
      const ring = new THREE.Line(geo, mat);
      // Tilt each ring differently
      ring.rotation.x = Math.PI / 2 + (i - 1) * 0.25;
      ring.rotation.z = i * 0.3;
      this.coreGroup.add(ring);
    });
  }

  /**
   * Contributor node particles — orbiting the core
   */
  private createContributorNodes(): void {
    const nodeCount = 60;
    const positions = new Float32Array(nodeCount * 3);
    const colors = new Float32Array(nodeCount * 3);
    const sizes = new Float32Array(nodeCount);

    const palette = [
      new THREE.Color(0x7b8cff), // purple
      new THREE.Color(0xc7f464), // lime
      new THREE.Color(0xff7d61), // coral
      new THREE.Color(0xffffff), // white
    ];

    for (let i = 0; i < nodeCount; i++) {
      // Distribute in a shell around the core
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const r = 1.5 + Math.random() * 2.5;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 2 + Math.random() * 4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    this.coreGroup.add(points);
    this.orbitParticles.push(points);
  }

  /**
   * Connection lines between random contributor nodes — data network
   */
  private createConnectionNetwork(): void {
    const lineCount = 30;
    const positions = new Float32Array(lineCount * 6);

    for (let i = 0; i < lineCount; i++) {
      for (let j = 0; j < 2; j++) {
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = 2 * Math.PI * Math.random();
        const r = 1.2 + Math.random() * 2.0;
        positions[i * 6 + j * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 6 + j * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 6 + j * 3 + 2] = r * Math.cos(phi);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
      color: 0x7b8cff,
      transparent: true,
      opacity: 0.06,
    });

    const lines = new THREE.LineSegments(geo, mat);
    this.coreGroup.add(lines);
    this.connectionLines.push(lines);
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.isAnimating || !this.renderer || !this.scene || !this.camera) return;
    this.animationId = requestAnimationFrame(this.animate);

    const elapsed = this.clock.getElapsedTime();

    // Smooth mouse follow
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    if (this.coreGroup) {
      // Slow base rotation
      this.coreGroup.rotation.y = elapsed * 0.08 + this.mouse.x * 0.3;
      this.coreGroup.rotation.x = Math.sin(elapsed * 0.15) * 0.1 + this.mouse.y * 0.2;

      // Subtle float
      this.coreGroup.position.y = Math.sin(elapsed * 0.4) * 0.15;
    }

    // Rotate orbit particles
    this.orbitParticles.forEach((p) => {
      p.rotation.y = elapsed * 0.05;
      p.rotation.x = elapsed * 0.02;
    });

    // Pulse connection lines opacity
    this.connectionLines.forEach((l) => {
      const mat = l.material as THREE.LineBasicMaterial;
      mat.opacity = 0.04 + Math.sin(elapsed * 0.8) * 0.03;
    });

    // Pulse inner core children (sphere opacity)
    if (this.coreGroup.children.length > 3) {
      const innerSphere = this.coreGroup.children[2] as THREE.Mesh;
      if (innerSphere.material instanceof THREE.MeshBasicMaterial) {
        innerSphere.material.opacity = 0.1 + Math.sin(elapsed * 1.2) * 0.08;
      }
    }

    this.renderer.render(this.scene, this.camera);
  };
}
