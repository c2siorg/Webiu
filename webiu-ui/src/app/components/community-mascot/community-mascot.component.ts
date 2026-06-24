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
  selector: 'app-community-mascot',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas #mascotCanvas class="mascot-canvas" (click)="celebrate()"></canvas>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 380px;
        position: relative;
        overflow: hidden;
        cursor: pointer;
      }
      .mascot-canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class CommunityMascotComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mascotCanvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationId = 0;
  private isBrowser: boolean;
  private observer!: IntersectionObserver;
  private isAnimating = false;

  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private clock = new THREE.Clock();

  // Figurine Groups & Meshes for animations
  private mascotGroup!: THREE.Group;
  private headGroup!: THREE.Group;
  private bodyMesh!: THREE.Mesh;
  private leftArm!: THREE.Mesh;
  private rightArm!: THREE.Mesh;
  private basketGroup!: THREE.Group;
  private cheekLeftMat!: THREE.MeshStandardMaterial;
  private cheekRightMat!: THREE.MeshStandardMaterial;
  private atmosphericGlow!: THREE.Mesh;

  // Pumpkins & Bats arrays
  private pumpkins: THREE.Group[] = [];
  private bats: {
    group: THREE.Group;
    wingL: THREE.Group;
    wingR: THREE.Group;
    initialY: number;
    initialX: number;
    initialZ: number;
    speed: number;
    range: number;
    type: 'hover' | 'orbit' | 'wander';
    phase: number;
  }[] = [];

  // Emissive pumpkin face material
  private faceGlowMat!: THREE.MeshStandardMaterial;

  // Celebration state variables
  private isCelebrating = false;
  private celebrationTimer = 0;
  private celebrationDuration = 1.6; // 1.6 seconds of happy celebration

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

  celebrate(): void {
    if (this.isCelebrating) return;
    this.isCelebrating = true;
    this.celebrationTimer = 0;
  }

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
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Premium Blender-like Tone Mapping
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
    } catch (e) {
      console.warn('WebGL is not supported or failed to initialize:', e);
      return;
    }

    this.scene = new THREE.Scene();

    // Camera setup - framed to feel like a collectible figurine showcase
    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    this.camera.position.set(0, 1.4, 7.5);
    this.camera.lookAt(0, 0.2, 0);

    // Add Lights
    this.addLighting();

    // Create Atmospheric Purple Backlight Glow Card
    this.createAtmosphericGlow();

    // Create 3D Figurine Showcase components
    this.createDisplayPlatform();
    this.createMascotCharacter();
    this.createDecorations();
    this.createBats();

    // Add warm localized light points for pumpkins
    this.addPumpkinPointLights();
  }

  private addLighting(): void {
    // Soft deep purple ambient backdrop lighting
    const ambientLight = new THREE.AmbientLight(0x282348, 1.2);
    this.scene.add(ambientLight);

    // Main: Warm front key light (#FFD9A0)
    const keyLight = new THREE.DirectionalLight(0xffd9a0, 2.5);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.002;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    // Blur soft shadows
    keyLight.shadow.radius = 4;
    this.scene.add(keyLight);

    // CRITICAL: Purple rim light behind character (#A855F7)
    const purpleRim = new THREE.DirectionalLight(0xa855f7, 4.0);
    purpleRim.position.set(-5, 4, -6);
    purpleRim.lookAt(0, 0.2, 0);
    this.scene.add(purpleRim);

    // Soft cyan fill light for extra color contrast on shadows
    const cyanFill = new THREE.DirectionalLight(0x4da6ff, 0.6);
    cyanFill.position.set(-6, -2, 3);
    this.scene.add(cyanFill);
  }

  private createAtmosphericGlow(): void {
    // Create a circular billboard behind character with a soft radial purple/magenta gradient texture
    const glowGeo = new THREE.PlaneGeometry(6.5, 6.5);
    
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const ctx = glowCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, 'rgba(168, 85, 247, 0.26)'); // #A855F7 (emissive purple backlight)
      grad.addColorStop(0.5, 'rgba(123, 74, 219, 0.08)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    
    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    const glowMat = new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    this.atmosphericGlow = new THREE.Mesh(glowGeo, glowMat);
    this.atmosphericGlow.position.set(0, 0.2, -1.8);
    this.scene.add(this.atmosphericGlow);
  }

  private createDisplayPlatform(): void {
    // 1. Moss green top platform (#334D3D)
    const topGeo = new THREE.CylinderGeometry(2.35, 2.35, 0.15, 40);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x334d3d,
      roughness: 0.9,
      metalness: 0.05,
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = -1.0;
    topMesh.receiveShadow = true;
    this.scene.add(topMesh);

    // Rounded rim top transition using a torus
    const rimGeo = new THREE.TorusGeometry(2.32, 0.08, 12, 40);
    const rim = new THREE.Mesh(rimGeo, topMat);
    rim.position.y = -0.925;
    rim.rotation.x = Math.PI / 2;
    rim.receiveShadow = true;
    this.scene.add(rim);

    // 2. Bottom clay platform layer (#CFA77A)
    const bottomGeo = new THREE.CylinderGeometry(2.35, 2.38, 0.35, 40);
    const bottomMat = new THREE.MeshStandardMaterial({
      color: 0xcfa77a,
      roughness: 0.9,
      metalness: 0.05,
    });
    const bottomMesh = new THREE.Mesh(bottomGeo, bottomMat);
    bottomMesh.position.y = -1.25;
    bottomMesh.receiveShadow = true;
    this.scene.add(bottomMesh);

    // 3. Dripping Grass Overhang (Organic overlapping green spheres around the edge)
    const numDrips = 28;
    const radius = 2.34;
    const dripGeo = new THREE.SphereGeometry(0.12, 12, 12);
    for (let i = 0; i < numDrips; i++) {
      const angle = (i / numDrips) * Math.PI * 2;
      const drip = new THREE.Mesh(dripGeo, topMat);
      
      const dripOffsetY = Math.sin(i * 1.6) * 0.05 - 0.04;
      drip.position.set(Math.cos(angle) * radius, -1.0 + dripOffsetY, Math.sin(angle) * radius);
      
      // Squash/Stretch drips vertically for drop look
      drip.scale.set(1.0, 1.4 + Math.sin(i) * 0.4, 1.0);
      drip.castShadow = true;
      drip.receiveShadow = true;
      this.scene.add(drip);
    }
  }

  private createMascotCharacter(): void {
    this.mascotGroup = new THREE.Group();
    this.mascotGroup.position.set(0, -0.9, 0.2); // Align mascot on top of the base
    this.scene.add(this.mascotGroup);

    // 1. Shirt/Body (Blue Cylinder in #1D2951)
    const shirtGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.8, 16);
    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0x1d2951, // dark navy hoodie fabric
      roughness: 0.9, // soft fabric texture
      metalness: 0.05,
    });
    this.bodyMesh = new THREE.Mesh(shirtGeo, shirtMat);
    this.bodyMesh.position.y = 0.4;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.mascotGroup.add(this.bodyMesh);

    // 2. Collar (Torus)
    const collarGeo = new THREE.TorusGeometry(0.24, 0.05, 8, 16);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x141f3b, roughness: 0.9 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 0.8, 0);
    collar.rotation.x = Math.PI / 2;
    this.mascotGroup.add(collar);

    // 3. Shorts/Pants (Blue Box/Cylinder parts)
    const pantsGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.15, 16);
    const pants = new THREE.Mesh(pantsGeo, shirtMat);
    pants.position.y = 0.02;
    this.mascotGroup.add(pants);

    // 4. Head Group (Includes Face, Hair, Helmet, Cheeks, Eyes)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.1, 0);
    this.mascotGroup.add(this.headGroup);

    // Face/Skin
    const faceGeo = new THREE.SphereGeometry(0.48, 32, 32);
    const faceMat = new THREE.MeshStandardMaterial({
      color: 0xffdbcc, // soft peach skin
      roughness: 0.9,
    });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.castShadow = true;
    face.receiveShadow = true;
    this.headGroup.add(face);

    // Cute skin/pink ears peeking out on sides
    const earGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const earMat = new THREE.MeshStandardMaterial({ color: 0xffccb3, roughness: 0.95 });
    
    const earL = new THREE.Mesh(earGeo, earMat);
    earL.position.set(-0.43, 0.06, 0.05);
    earL.scale.set(1.2, 1.2, 0.7);
    this.headGroup.add(earL);

    const earR = new THREE.Mesh(earGeo, earMat);
    earR.position.set(0.43, 0.06, 0.05);
    earR.scale.set(1.2, 1.2, 0.7);
    this.headGroup.add(earR);

    // Hair Bangs (Stylized brown clay locks hanging over forehead)
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x5c3c2b, roughness: 0.95 });
    const hairLockGeo = new THREE.SphereGeometry(0.1, 12, 12);
    const bangs = [
      { x: -0.26, y: 0.28, z: 0.35, sx: 0.85, sy: 1.3, sz: 0.85 },
      { x: -0.1, y: 0.3, z: 0.38, sx: 1.0, sy: 1.5, sz: 1.0 },
      { x: 0.1, y: 0.3, z: 0.38, sx: 1.0, sy: 1.4, sz: 1.0 },
      { x: 0.26, y: 0.28, z: 0.35, sx: 0.85, sy: 1.3, sz: 0.85 },
    ];
    bangs.forEach((bang) => {
      const lock = new THREE.Mesh(hairLockGeo, hairMat);
      lock.position.set(bang.x, bang.y, bang.z);
      lock.scale.set(bang.sx, bang.sy, bang.sz);
      lock.castShadow = true;
      this.headGroup.add(lock);
    });

    // Ribbed Pumpkin Helmet (Composed of overlapping rotated ellipsoids)
    const helmetGroup = new THREE.Group();
    helmetGroup.position.set(0, 0.08, 0);
    this.headGroup.add(helmetGroup);

    const helmetSegmentMat = new THREE.MeshStandardMaterial({
      color: 0xe86c31, // matte pumpkin orange
      roughness: 0.78,
      metalness: 0.05,
    });
    const helmetSegmentGeo = new THREE.SphereGeometry(0.49, 24, 24);
    const helmetSegments = 7;
    for (let i = 0; i < helmetSegments; i++) {
      const segment = new THREE.Mesh(helmetSegmentGeo, helmetSegmentMat);
      segment.rotation.y = (i / helmetSegments) * Math.PI;
      segment.scale.set(1.07, 0.9, 0.85); // Squash and stretch to form vertical ribs
      segment.castShadow = true;
      helmetGroup.add(segment);
    }

    // Pumpkin Stem on top of helmet
    const stemGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.16, 8);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x5a7a42, // pumpkin stem green
      roughness: 0.9,
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(0, 0.62, 0.02);
    stem.rotation.z = 0.15;
    stem.castShadow = true;
    this.headGroup.add(stem);

    // Sleepy Expressive Eyes (horizontal capsules, angled down)
    const eyeGeo = new THREE.CapsuleGeometry(0.042, 0.1, 8, 12);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.95 });
    
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.18, 0.08, 0.39);
    eyeL.rotation.z = Math.PI / 2.3; // tilt outward slightly
    eyeL.rotation.y = -0.15;
    this.headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.18, 0.08, 0.39);
    eyeR.rotation.z = -Math.PI / 2.3; // tilt outward slightly
    eyeR.rotation.y = 0.15;
    this.headGroup.add(eyeR);

    // Nose (tiny skin sphere)
    const noseGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const nose = new THREE.Mesh(noseGeo, faceMat);
    nose.position.set(0, 0.01, 0.46);
    this.headGroup.add(nose);

    // Mouth (tiny red mouth shape)
    const mouthGeo = new THREE.TorusGeometry(0.03, 0.01, 4, 8, Math.PI);
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0xbb3333, roughness: 0.9 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.1, 0.44);
    mouth.rotation.x = 0.1;
    this.headGroup.add(mouth);

    // Blushing cheeks (glow/emissive standard pink)
    const cheekGeo = new THREE.SphereGeometry(0.06, 8, 8);
    this.cheekLeftMat = new THREE.MeshStandardMaterial({
      color: 0xff6688,
      emissive: 0xff3366,
      emissiveIntensity: 0.2,
      roughness: 0.9,
    });
    this.cheekRightMat = this.cheekLeftMat.clone();

    const cheekL = new THREE.Mesh(cheekGeo, this.cheekLeftMat);
    cheekL.position.set(-0.31, -0.06, 0.38);
    this.headGroup.add(cheekL);

    const cheekR = new THREE.Mesh(cheekGeo, this.cheekRightMat);
    cheekR.position.set(0.31, -0.06, 0.38);
    this.headGroup.add(cheekR);

    // 5. Arms (peach skin capsule limbs)
    const armGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbcc, roughness: 0.8 });

    this.leftArm = new THREE.Mesh(armGeo, skinMat);
    this.leftArm.position.set(-0.55, 0.55, 0.05);
    this.leftArm.scale.set(1, 2.2, 1);
    this.leftArm.castShadow = true;
    this.mascotGroup.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, skinMat);
    this.rightArm.position.set(0.55, 0.55, 0.05);
    this.rightArm.scale.set(1, 2.2, 1);
    this.rightArm.castShadow = true;
    this.mascotGroup.add(this.rightArm);

    // 6. Detailed Woven Basket & Candies
    this.createBasket();

    // 7. Legs & Boots
    const legGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.35, 12);
    const legL = new THREE.Mesh(legGeo, skinMat);
    legL.position.set(-0.16, -0.15, 0);
    this.mascotGroup.add(legL);

    const legR = new THREE.Mesh(legGeo, skinMat);
    legR.position.set(0.16, -0.15, 0);
    this.mascotGroup.add(legR);

    // Boots (Cream/Beige rounded cylinders, angled outwards slightly)
    const bootGeo = new THREE.CylinderGeometry(0.15, 0.16, 0.18, 12);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0xeae6d8, roughness: 0.85 });
    
    const bootL = new THREE.Mesh(bootGeo, bootMat);
    bootL.position.set(-0.17, -0.32, 0.04);
    bootL.rotation.y = 0.25; // angle outwards
    bootL.castShadow = true;
    this.mascotGroup.add(bootL);

    const bootR = new THREE.Mesh(bootGeo, bootMat);
    bootR.position.set(0.17, -0.32, 0.04);
    bootR.rotation.y = -0.25; // angle outwards
    bootR.castShadow = true;
    this.mascotGroup.add(bootR);
  }

  private createBasket(): void {
    this.basketGroup = new THREE.Group();
    // Position basket hanging near mascot's right hand/arm
    this.basketGroup.position.set(0.62, 0.3, 0.3);
    this.mascotGroup.add(this.basketGroup);

    // 100x DETAILED: Hand-woven wood basket geometry (#8B5A2B)
    const basketContainer = new THREE.Group();
    this.basketGroup.add(basketContainer);

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b, // warm wood brown
      roughness: 0.95,
    });

    // Vertical Woven Strands/Ribs
    const numStrands = 12;
    const strandGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6);
    for (let i = 0; i < numStrands; i++) {
      const angle = (i / numStrands) * Math.PI * 2;
      const strand = new THREE.Mesh(strandGeo, woodMat);
      strand.position.set(Math.cos(angle) * 0.19, 0, Math.sin(angle) * 0.19);
      strand.rotation.y = -angle;
      strand.castShadow = true;
      basketContainer.add(strand);
    }

    // Horizontal Weave Rings (stacked torus rings)
    const weaveRingGeo = new THREE.TorusGeometry(0.19, 0.015, 6, 24);
    const numRings = 4;
    for (let i = 0; i < numRings; i++) {
      const ring = new THREE.Mesh(weaveRingGeo, woodMat);
      ring.position.y = -0.1 + (i * 0.07);
      ring.rotation.x = Math.PI / 2;
      ring.castShadow = true;
      basketContainer.add(ring);
    }

    // Solid Basket Floor base
    const floorGeo = new THREE.CylinderGeometry(0.16, 0.15, 0.03, 12);
    const floor = new THREE.Mesh(floorGeo, woodMat);
    floor.position.y = -0.115;
    floor.castShadow = true;
    basketContainer.add(floor);

    // Basket handle (Torus half)
    const handleGeo = new THREE.TorusGeometry(0.19, 0.022, 6, 16, Math.PI);
    const handle = new THREE.Mesh(handleGeo, woodMat);
    handle.position.set(0, 0.12, 0);
    handle.castShadow = true;
    basketContainer.add(handle);

    // Candies inside: Glossy wrapper reflections (Shiny metallic materials)
    const candyGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const twistGeo = new THREE.ConeGeometry(0.025, 0.04, 5);
    const candyMat = new THREE.MeshStandardMaterial({
      color: 0x4da6ff, // glossy blue candy wrapper
      roughness: 0.12,
      metalness: 0.8,
    });

    for (let i = 0; i < 6; i++) {
      const candy = new THREE.Group();
      
      // Candy Core
      const core = new THREE.Mesh(candyGeo, candyMat);
      core.castShadow = true;
      candy.add(core);

      // Twisted Wrapper Ends (Left & Right cones)
      const twistL = new THREE.Mesh(twistGeo, candyMat);
      twistL.position.set(-0.05, 0, 0);
      twistL.rotation.z = Math.PI / 2;
      candy.add(twistL);

      const twistR = new THREE.Mesh(twistGeo, candyMat);
      twistR.position.set(0.05, 0, 0);
      twistR.rotation.z = -Math.PI / 2;
      candy.add(twistR);

      // Random position inside the basket container
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 0.12;
      candy.position.set(
        Math.cos(angle) * dist,
        -0.02 + Math.random() * 0.06,
        Math.sin(angle) * dist
      );
      candy.rotation.set(Math.random() * 0.5, Math.random() * 3, Math.random() * 0.5);

      basketContainer.add(candy);
    }
  }

  private createDecorations(): void {
    // 1. Tombstone (left side of platform) with nested step borders & cross relief
    const tsGroup = new THREE.Group();
    tsGroup.position.set(-1.3, -0.92, -0.4);
    tsGroup.rotation.y = 0.4;
    this.scene.add(tsGroup);

    const stoneGeo = new THREE.BoxGeometry(0.38, 0.65, 0.14);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6e788c, roughness: 0.95 });
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.y = 0.3;
    stone.castShadow = true;
    stone.receiveShadow = true;
    tsGroup.add(stone);

    // Rounded arch top for tombstone
    const stoneTopGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.14, 16, 1, false, 0, Math.PI);
    const stoneTop = new THREE.Mesh(stoneTopGeo, stoneMat);
    stoneTop.position.set(0, 0.625, 0);
    stoneTop.rotation.z = Math.PI / 2;
    stoneTop.rotation.x = Math.PI / 2;
    stoneTop.castShadow = true;
    tsGroup.add(stoneTop);

    // Nested relief border step on front face
    const borderGeo = new THREE.BoxGeometry(0.3, 0.55, 0.03);
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x576073, roughness: 0.95 });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.position.set(0, 0.28, 0.085);
    tsGroup.add(borderMesh);

    // Cross engraving relief (Step box shapes)
    const crossVertGeo = new THREE.BoxGeometry(0.045, 0.24, 0.015);
    const crossHorizGeo = new THREE.BoxGeometry(0.14, 0.045, 0.015);
    const crossMat = new THREE.MeshStandardMaterial({ color: 0x475061, roughness: 0.95 });
    
    const crossV = new THREE.Mesh(crossVertGeo, crossMat);
    crossV.position.set(0, 0.3, 0.105);
    tsGroup.add(crossV);

    const crossH = new THREE.Mesh(crossHorizGeo, crossMat);
    crossH.position.set(0, 0.34, 0.105);
    tsGroup.add(crossH);

    // 2. Ribbed Glowing Jack-o'-Lanterns (5 varied pumpkins)
    this.faceGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffe099,
      emissive: 0xffb347, // Emits warm orange light (#FFB347)
      emissiveIntensity: 1.8,
      roughness: 0.9,
    });

    this.createJackOLantern(1.1, -0.9, 0.8, 0.3, -0.2); // right front
    this.createJackOLantern(-0.8, -0.95, 1.2, 0.25, 0.4); // left front
    this.createJackOLantern(1.2, -0.95, -0.6, 0.28, -0.5); // right back
    this.createJackOLantern(-1.3, -0.95, 0.7, 0.2, 0.9); // left side small
    this.createJackOLantern(0.4, -0.98, -1.2, 0.24, 0.1); // center back
  }

  private createJackOLantern(x: number, y: number, z: number, scale: number, rotationY: number): void {
    const pumpkin = new THREE.Group();
    pumpkin.position.set(x, y + scale * 0.32, z);
    pumpkin.rotation.y = rotationY;
    this.scene.add(pumpkin);

    // Ribbed Pumpkin body (overlapping squashed ellipsoids)
    const pumpkinBody = new THREE.Group();
    const segmentMat = new THREE.MeshStandardMaterial({
      color: 0xe86c31,
      roughness: 0.82,
    });
    const segmentGeo = new THREE.SphereGeometry(0.34, 16, 16);
    const segments = 6;
    for (let i = 0; i < segments; i++) {
      const segment = new THREE.Mesh(segmentGeo, segmentMat);
      segment.rotation.y = (i / segments) * Math.PI;
      segment.scale.set(1.12, 0.88, 0.72); // squash and stretch segment
      segment.castShadow = true;
      segment.receiveShadow = true;
      pumpkinBody.add(segment);
    }
    pumpkin.add(pumpkinBody);

    // Curved stem
    const stemGeo = new THREE.CylinderGeometry(0.025, 0.04, 0.1, 8);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x485c35, roughness: 0.9 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(0, 0.32, -0.02);
    stem.rotation.x = -0.2; // curved/tilted back
    stem.castShadow = true;
    pumpkin.add(stem);

    // Overlay glowing eyes & mouth cutouts (eyes: rounded sockets, mouth: smiling)
    const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
    
    const eyeL = new THREE.Mesh(eyeGeo, this.faceGlowMat);
    eyeL.position.set(-0.1, 0.08, 0.32);
    eyeL.scale.set(1, 1.2, 0.3);
    pumpkin.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, this.faceGlowMat);
    eyeR.position.set(0.1, 0.08, 0.32);
    eyeR.scale.set(1, 1.2, 0.3);
    pumpkin.add(eyeR);

    // Cute smiling mouth cutout
    const mouthGeo = new THREE.TorusGeometry(0.08, 0.025, 4, 12, Math.PI);
    const mouth = new THREE.Mesh(mouthGeo, this.faceGlowMat);
    mouth.position.set(0, -0.02, 0.31);
    mouth.rotation.x = Math.PI; // flip to face smile up
    pumpkin.add(mouth);

    // Scale final group
    pumpkin.scale.set(scale, scale, scale);
    this.pumpkins.push(pumpkin);
  }

  private createBats(): void {
    // We add 3 bats with unique flight configuration profiles
    this.addBat(-1.3, 1.2, 0.4, 0.012, 0.28, 'hover', 0);
    this.addBat(1.4, 1.4, -0.3, 0.016, 0.22, 'orbit', Math.PI);
    this.addBat(0.2, 1.5, 0.8, 0.01, 0.24, 'wander', Math.PI / 2);
  }

  private addBat(
    x: number,
    y: number,
    z: number,
    speed: number,
    range: number,
    type: 'hover' | 'orbit' | 'wander',
    phase: number
  ): void {
    const batGroup = new THREE.Group();
    batGroup.position.set(x, y, z);
    this.scene.add(batGroup);

    // Bat body (Black Sphere: #1F1F24)
    const bodyGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1f1f24,
      roughness: 0.9,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    batGroup.add(body);

    // Glowing eyes (oversized yellow spheres: #FFF275)
    const eyeGeo = new THREE.SphereGeometry(0.018, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfff275 });
    
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.035, 0.01, 0.08);
    batGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.035, 0.01, 0.08);
    batGroup.add(eyeR);

    // Detailed bat ears
    const earGeo = new THREE.ConeGeometry(0.025, 0.06, 4);
    const earL = new THREE.Mesh(earGeo, bodyMat);
    earL.position.set(-0.04, 0.09, 0);
    earL.rotation.z = 0.25;
    batGroup.add(earL);

    const earR = new THREE.Mesh(earGeo, bodyMat);
    earR.position.set(0.04, 0.09, 0);
    earR.rotation.z = -0.25;
    batGroup.add(earR);

    // Jointed/segmented wings
    const wingL = new THREE.Group();
    wingL.position.set(-0.07, 0, 0);
    batGroup.add(wingL);

    const innerWingGeo = new THREE.BoxGeometry(0.18, 0.08, 0.01);
    const innerWingL = new THREE.Mesh(innerWingGeo, bodyMat);
    innerWingL.position.set(-0.09, 0, 0);
    wingL.add(innerWingL);

    const outerWingGeo = new THREE.BoxGeometry(0.14, 0.06, 0.01);
    const outerWingL = new THREE.Mesh(outerWingGeo, bodyMat);
    outerWingL.position.set(-0.22, -0.01, 0);
    outerWingL.rotation.z = -0.25;
    wingL.add(outerWingL);

    const wingR = new THREE.Group();
    wingR.position.set(0.07, 0, 0);
    batGroup.add(wingR);

    const innerWingR = new THREE.Mesh(innerWingGeo, bodyMat);
    innerWingR.position.set(0.09, 0, 0);
    wingR.add(innerWingR);

    const outerWingR = new THREE.Mesh(outerWingGeo, bodyMat);
    outerWingR.position.set(0.22, -0.01, 0);
    outerWingR.rotation.z = 0.25;
    wingR.add(outerWingR);

    this.bats.push({
      group: batGroup,
      wingL,
      wingR,
      initialY: y,
      initialX: x,
      initialZ: z,
      speed,
      range,
      type,
      phase,
    });
  }

  private addPumpkinPointLights(): void {
    // Put localized warm orange point lights (#FFB347) directly near pumpkins
    this.pumpkins.forEach((pumpkin) => {
      const pLight = new THREE.PointLight(0xffb347, 2.0, 3.0);
      pLight.position.set(
        pumpkin.position.x,
        pumpkin.position.y + 0.15,
        pumpkin.position.z + 0.25
      );
      pLight.castShadow = true;
      pLight.shadow.bias = -0.004;
      this.scene.add(pLight);
    });
  }

  private animate = (): void => {
    if (!this.isAnimating || !this.renderer || !this.scene || !this.camera) return;
    this.animationId = requestAnimationFrame(this.animate);

    const elapsed = this.clock.getElapsedTime();

    // 1. Mouse movements look-at ease interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

    // 2. Idle Mascot slow breathing, chest scale, and basket lag
    if (this.mascotGroup && this.headGroup && this.bodyMesh && this.basketGroup) {
      if (!this.isCelebrating) {
        // Slow chest breathing (body Y-position bobbing and shirt scaling)
        const breathePhase = elapsed * 1.6;
        const breatheOffset = Math.sin(breathePhase) * 0.02;
        
        this.mascotGroup.position.y = -0.9 + breatheOffset;
        this.bodyMesh.scale.y = 1.0 + breatheOffset * 0.3;
        
        // Delayed secondary movement for the basket (delayed phase)
        this.basketGroup.position.y = 0.3 + Math.sin(breathePhase - 0.5) * 0.015;

        this.leftArm.rotation.z = Math.sin(breathePhase) * 0.05;
        this.rightArm.rotation.z = -Math.sin(breathePhase) * 0.05;

        // Head tilt following mouse
        this.headGroup.rotation.y = this.mouse.x * 0.44;
        this.headGroup.rotation.x = -this.mouse.y * 0.2;
        this.headGroup.rotation.z = this.mouse.x * 0.08;
      }
    }

    // 3. Bat unique flights and wing flapping speeds
    this.bats.forEach((bat) => {
      const batTime = elapsed * 2.0 + bat.phase;

      if (bat.type === 'hover') {
        // Bat 1: slow vertical hovering
        bat.group.position.y = bat.initialY + Math.sin(batTime * 1.2) * bat.range;
        bat.group.position.x = bat.initialX + Math.cos(batTime * 0.4) * 0.05;
        
        // Flap speed
        const flap = Math.sin(elapsed * 12) * 0.6;
        bat.wingL.rotation.z = flap;
        bat.wingR.rotation.z = -flap;
      } 
      else if (bat.type === 'orbit') {
        // Bat 2: circular horizontal orbit around character
        const orbitAngle = elapsed * 0.8 + bat.phase;
        const orbitRadius = 1.8;
        
        bat.group.position.x = Math.sin(orbitAngle) * orbitRadius;
        bat.group.position.z = Math.cos(orbitAngle) * orbitRadius;
        bat.group.position.y = bat.initialY + Math.sin(batTime * 1.5) * 0.12;

        // Face forward along trajectory
        bat.group.rotation.y = orbitAngle + Math.PI / 2;

        // Fast flapping speed
        const flap = Math.sin(elapsed * 18) * 0.65;
        bat.wingL.rotation.z = flap;
        bat.wingR.rotation.z = -flap;
      } 
      else if (bat.type === 'wander') {
        // Bat 3: left-right wandering with vertical variation
        bat.group.position.x = bat.initialX + Math.sin(elapsed * 1.0) * 1.5;
        bat.group.position.y = bat.initialY + Math.cos(elapsed * 1.6) * 0.22;
        
        // Medium flapping speed
        const flap = Math.sin(elapsed * 15) * 0.6;
        bat.wingL.rotation.z = flap;
        bat.wingR.rotation.z = -flap;
      }
    });

    // 4. Jack-o'-Lantern warm breathing pulse
    if (this.faceGlowMat) {
      this.faceGlowMat.emissiveIntensity = 1.6 + Math.sin(elapsed * 3.2) * 0.25;
    }

    // 5. Ambient backlight glow breathing
    if (this.atmosphericGlow) {
      this.atmosphericGlow.scale.setScalar(1.0 + Math.sin(elapsed * 1.2) * 0.04);
    }

    // 6. Celebration Event Timeline
    if (this.isCelebrating) {
      this.celebrationTimer += 0.024; // step delta approximation

      const progress = this.celebrationTimer / this.celebrationDuration;

      if (progress >= 1.0) {
        // Reset states
        this.isCelebrating = false;
        this.mascotGroup.position.y = -0.9;
        this.mascotGroup.rotation.y = 0;
        this.leftArm.rotation.z = 0;
        this.rightArm.rotation.z = 0;
        this.cheekLeftMat.emissiveIntensity = 0.2;
        this.cheekRightMat.emissiveIntensity = 0.2;
      } else {
        // Jump/Bounce path (absolute sine wave)
        const bounceHeight = Math.abs(Math.sin(progress * Math.PI * 2.2)) * 0.65;
        this.mascotGroup.position.y = -0.9 + bounceHeight;

        // Cute 360-degree spin
        this.mascotGroup.rotation.y = progress * Math.PI * 2;

        // Fast arm waving
        const wave = Math.sin(this.celebrationTimer * 22) * 0.9;
        this.leftArm.rotation.z = Math.PI / 1.6 + wave;
        this.rightArm.rotation.z = -Math.PI / 1.6 - wave;

        // Double blush glow intensity
        this.cheekLeftMat.emissiveIntensity = 1.2;
        this.cheekRightMat.emissiveIntensity = 1.2;

        // Pumpkins react by pulsing brighter
        if (this.faceGlowMat) {
          this.faceGlowMat.emissiveIntensity = 2.5 + Math.sin(this.celebrationTimer * 18) * 0.5;
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  };
}
