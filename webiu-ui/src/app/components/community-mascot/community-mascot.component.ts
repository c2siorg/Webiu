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

  // Mascot Groups & Meshes for animations
  private mascotGroup!: THREE.Group;
  private headGroup!: THREE.Group;
  private leftArm!: THREE.Mesh;
  private rightArm!: THREE.Mesh;
  private cheekLeftMat!: THREE.MeshStandardMaterial;
  private cheekRightMat!: THREE.MeshStandardMaterial;

  // Pumpkins & Bats arrays
  private pumpkins: THREE.Group[] = [];
  private bats: {
    group: THREE.Group;
    wingGroupL: THREE.Group;
    wingGroupR: THREE.Group;
    initialY: number;
    initialX: number;
    speed: number;
    range: number;
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
    } catch (e) {
      console.warn('WebGL is not supported or failed to initialize:', e);
      return;
    }

    this.scene = new THREE.Scene();

    // Camera setup - zoomed in slightly to frame the character nicely
    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    this.camera.position.set(0, 1.3, 7.5);
    this.camera.lookAt(0, 0.2, 0);

    // Add Lights
    this.addLighting();

    // Create 3D Clay Scene components
    this.createPedestal();
    this.createMascotCharacter();
    this.createDecorations();
    this.createBats();

    // Add warm localized light points for pumpkins
    this.addPumpkinPointLights();
  }

  private addLighting(): void {
    // Soft deep purple ambient backdrop lighting
    const ambientLight = new THREE.AmbientLight(0x282348, 1.3);
    this.scene.add(ambientLight);

    // Warm key light (moonlight effect) casting soft shadows
    const keyLight = new THREE.DirectionalLight(0xfff3e0, 2.5);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.002;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    this.scene.add(keyLight);

    // CRITICAL: Cyan Rim light from behind (outlines the character for premium render quality)
    const cyanRim = new THREE.DirectionalLight(0x3bd0ff, 3.8);
    cyanRim.position.set(-6, 4, -6);
    cyanRim.lookAt(0, 0.2, 0);
    this.scene.add(cyanRim);

    // CRITICAL: Secondary soft magenta rim light for chromatic contrast
    const magentaRim = new THREE.DirectionalLight(0xff5cb3, 1.4);
    magentaRim.position.set(6, 3, -6);
    magentaRim.lookAt(0, 0.2, 0);
    this.scene.add(magentaRim);

    // Soft yellow fill light from front left
    const fillLight = new THREE.DirectionalLight(0xffea9f, 0.5);
    fillLight.position.set(-4, 2, 3);
    this.scene.add(fillLight);
  }

  private createPedestal(): void {
    // 1. Pedestal base (dark clay brown)
    const baseGeo = new THREE.CylinderGeometry(2.35, 2.4, 0.35, 40);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x5c3d26, // rich chocolate clay
      roughness: 0.9,
      metalness: 0.05,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -1.2;
    baseMesh.receiveShadow = true;
    this.scene.add(baseMesh);

    // 2. Green grass top layer
    const grassGeo = new THREE.CylinderGeometry(2.37, 2.37, 0.08, 40);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x2e4f2a, // dark organic green clay
      roughness: 0.95,
      metalness: 0.02,
    });
    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.position.y = -1.0;
    grassMesh.receiveShadow = true;
    this.scene.add(grassMesh);

    // 3. Dripping Grass Overhang (Organic overlapping green spheres around the edge)
    const numDrips = 28;
    const radius = 2.36;
    const dripGeo = new THREE.SphereGeometry(0.12, 12, 12);
    for (let i = 0; i < numDrips; i++) {
      const angle = (i / numDrips) * Math.PI * 2;
      const drip = new THREE.Mesh(dripGeo, grassMat);
      
      // Add wave pattern to drip offset for natural/organic growth look
      const dripOffsetY = Math.sin(i * 1.6) * 0.05 - 0.04;
      drip.position.set(Math.cos(angle) * radius, -1.0 + dripOffsetY, Math.sin(angle) * radius);
      
      // Squash/Stretch drips vertically
      drip.scale.set(1.0, 1.3 + Math.sin(i) * 0.4, 1.0);
      drip.castShadow = true;
      drip.receiveShadow = true;
      this.scene.add(drip);
    }
  }

  private createMascotCharacter(): void {
    this.mascotGroup = new THREE.Group();
    this.mascotGroup.position.set(0, -0.9, 0.2); // Align mascot on top of the base
    this.scene.add(this.mascotGroup);

    // 1. Shirt/Body (Blue Cylinder)
    const shirtGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.8, 16);
    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0x223659, // dark indigo clay
      roughness: 0.85,
      metalness: 0.05,
    });
    const shirt = new THREE.Mesh(shirtGeo, shirtMat);
    shirt.position.y = 0.4;
    shirt.castShadow = true;
    shirt.receiveShadow = true;
    this.mascotGroup.add(shirt);

    // 2. Collar (Torus)
    const collarGeo = new THREE.TorusGeometry(0.24, 0.05, 8, 16);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x1b2c4c, roughness: 0.85 });
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

    // 100x DETAILED: Ribbed Pumpkin Helmet (Composed of overlapping rotated ellipsoids)
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

    // 6. Basket (carried in right arm)
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
    const basket = new THREE.Group();
    basket.position.set(0.62, 0.3, 0.3);
    this.mascotGroup.add(basket);

    // Basket body (textured cylinder)
    const bodyGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.25, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.95 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    basket.add(body);

    // Basket handle (torus half)
    const handleGeo = new THREE.TorusGeometry(0.18, 0.025, 6, 12, Math.PI);
    const handle = new THREE.Mesh(handleGeo, bodyMat);
    handle.position.set(0, 0.12, 0);
    basket.add(handle);

    // Candy load inside basket (little colored spheres)
    const candyColors = [0x4da6ff, 0xff7b61, 0xc8ff4d, 0xffffff];
    for (let i = 0; i < 7; i++) {
      const size = 0.04 + Math.random() * 0.04;
      const candyGeo = new THREE.SphereGeometry(size, 8, 8);
      const candyMat = new THREE.MeshStandardMaterial({
        color: candyColors[i % candyColors.length],
        roughness: 0.6,
      });
      const candy = new THREE.Mesh(candyGeo, candyMat);
      candy.position.set(
        (Math.random() - 0.5) * 0.22,
        0.08 + Math.random() * 0.05,
        (Math.random() - 0.5) * 0.22
      );
      basket.add(candy);
    }
  }

  private createDecorations(): void {
    // 1. Tombstone (left side of platform) with nested step borders
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

    // Detailed: Nested relief step border on front face
    const borderGeo = new THREE.BoxGeometry(0.3, 0.55, 0.03);
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x576073, roughness: 0.95 });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.position.set(0, 0.28, 0.085);
    tsGroup.add(borderMesh);

    // 2. Ribbed Glowing Jack-o'-Lanterns
    this.faceGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffdf80,
      emissive: 0xffa500,
      emissiveIntensity: 1.6,
      roughness: 0.9,
    });

    this.createJackOLantern(1.1, -0.9, 0.8, 0.3, -0.2); // right front
    this.createJackOLantern(-0.8, -0.95, 1.2, 0.25, 0.4); // left front
    this.createJackOLantern(1.2, -0.95, -0.6, 0.28, -0.5); // right back
  }

  private createJackOLantern(x: number, y: number, z: number, scale: number, rotationY: number): void {
    const pumpkin = new THREE.Group();
    pumpkin.position.set(x, y + scale * 0.32, z);
    pumpkin.rotation.y = rotationY;
    this.scene.add(pumpkin);

    // 100x DETAILED: Ribbed Pumpkin body (overlapping squashed ellipsoids)
    const pumpkinBody = new THREE.Group();
    const segmentMat = new THREE.MeshStandardMaterial({
      color: 0xe66225, // organic dark orange clay
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

    // Small stem
    const stemGeo = new THREE.CylinderGeometry(0.025, 0.04, 0.1, 8);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x485c35, roughness: 0.9 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.32;
    stem.castShadow = true;
    pumpkin.add(stem);

    // Overlay glowing eyes & mouth (simulates face carving without CSG)
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.02);
    
    const eyeL = new THREE.Mesh(eyeGeo, this.faceGlowMat);
    eyeL.position.set(-0.11, 0.08, 0.32);
    eyeL.rotation.z = 0.3;
    pumpkin.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, this.faceGlowMat);
    eyeR.position.set(0.11, 0.08, 0.32);
    eyeR.rotation.z = -0.3;
    pumpkin.add(eyeR);

    // Mouth plane
    const mouthGeo = new THREE.BoxGeometry(0.14, 0.05, 0.02);
    const mouth = new THREE.Mesh(mouthGeo, this.faceGlowMat);
    mouth.position.set(0, -0.06, 0.33);
    pumpkin.add(mouth);

    // Scale final group
    pumpkin.scale.set(scale, scale, scale);
    this.pumpkins.push(pumpkin);
  }

  private createBats(): void {
    this.addBat(-1.4, 1.2, 0.4, 0.015, 0.3);
    this.addBat(1.5, 1.4, -0.3, 0.012, 0.25);
  }

  private addBat(x: number, y: number, z: number, speed: number, range: number): void {
    const batGroup = new THREE.Group();
    batGroup.position.set(x, y, z);
    this.scene.add(batGroup);

    // Bat body (Black Sphere)
    const bodyGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1d212b, roughness: 0.95 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    batGroup.add(body);

    // Glowing eyes (yellow spheres)
    const eyeGeo = new THREE.SphereGeometry(0.015, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffea4d });
    
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.035, 0.02, 0.08);
    batGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.035, 0.02, 0.08);
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

    // Detailed: Jointed/segmented wings
    const wingGroupL = new THREE.Group();
    wingGroupL.position.set(-0.07, 0, 0);
    batGroup.add(wingGroupL);

    const innerWingGeo = new THREE.BoxGeometry(0.18, 0.08, 0.01);
    const innerWingL = new THREE.Mesh(innerWingGeo, bodyMat);
    innerWingL.position.set(-0.09, 0, 0);
    wingGroupL.add(innerWingL);

    const outerWingGeo = new THREE.BoxGeometry(0.14, 0.06, 0.01);
    const outerWingL = new THREE.Mesh(outerWingGeo, bodyMat);
    outerWingL.position.set(-0.22, -0.01, 0);
    outerWingL.rotation.z = -0.25;
    wingGroupL.add(outerWingL);

    const wingGroupR = new THREE.Group();
    wingGroupR.position.set(0.07, 0, 0);
    batGroup.add(wingGroupR);

    const innerWingR = new THREE.Mesh(innerWingGeo, bodyMat);
    innerWingR.position.set(0.09, 0, 0);
    wingGroupR.add(innerWingR);

    const outerWingR = new THREE.Mesh(outerWingGeo, bodyMat);
    outerWingR.position.set(0.22, -0.01, 0);
    outerWingR.rotation.z = 0.25;
    wingGroupR.add(outerWingR);

    this.bats.push({
      group: batGroup,
      wingGroupL,
      wingGroupR,
      initialY: y,
      initialX: x,
      speed,
      range,
    });
  }

  private addPumpkinPointLights(): void {
    // Put localized warm orange point lights directly near each pumpkin base/face
    this.pumpkins.forEach((pumpkin) => {
      const pLight = new THREE.PointLight(0xff7700, 3.2, 3.2);
      // offset slightly forward/upwards of the pumpkin
      pLight.position.set(
        pumpkin.position.x,
        pumpkin.position.y + 0.1,
        pumpkin.position.z + 0.3
      );
      pLight.castShadow = true;
      pLight.shadow.bias = -0.005;
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

    // 2. Idle Character bobbing & head tilt
    if (this.mascotGroup && this.headGroup) {
      if (!this.isCelebrating) {
        // Idle bobbing
        this.mascotGroup.position.y = -0.9 + Math.sin(elapsed * 2.2) * 0.035;
        this.leftArm.rotation.z = Math.sin(elapsed * 2.2) * 0.06;
        this.rightArm.rotation.z = -Math.sin(elapsed * 2.2) * 0.06;

        // Head tilt following mouse
        this.headGroup.rotation.y = this.mouse.x * 0.48;
        this.headGroup.rotation.x = -this.mouse.y * 0.22;
        this.headGroup.rotation.z = this.mouse.x * 0.1;
      }
    }

    // 3. Bat hovering, floating & wing flapping
    this.bats.forEach((bat) => {
      bat.group.position.y = bat.initialY + Math.sin(elapsed * 4.0 + bat.initialX) * bat.range;
      bat.group.position.x = bat.initialX + Math.cos(elapsed * 1.5 + bat.initialY) * 0.08;

      // Fast organic wing flapping
      const flapAngle = Math.sin(elapsed * 14) * 0.6;
      bat.wingGroupL.rotation.z = flapAngle;
      bat.wingGroupR.rotation.z = -flapAngle;
    });

    // 4. Jack-o'-Lantern warm breathing pulse
    if (this.faceGlowMat) {
      this.faceGlowMat.emissiveIntensity = 1.3 + Math.sin(elapsed * 3.5) * 0.3;
    }

    // 5. Celebration Event Timeline
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
