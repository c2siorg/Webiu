import type gsap from 'gsap';

let gsapModule: typeof gsap | null = null;
let gsapPromise: Promise<typeof gsap> | null = null;

export function loadGsap(): Promise<typeof gsap> {
  if (gsapModule) {
    return Promise.resolve(gsapModule);
  }

  if (!gsapPromise) {
    gsapPromise = import('gsap').then((mod) => {
      gsapModule = mod.gsap;
      return gsapModule;
    });
  }

  return gsapPromise;
}
