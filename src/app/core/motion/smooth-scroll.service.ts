import { Injectable, NgZone, inject } from '@angular/core';

// Scroll suave solo con ratón: en táctil el scroll nativo ya es bueno y no se debe secuestrar.
// Se carga aparte para no engordar el bundle inicial.
@Injectable({ providedIn: 'root' })
export class SmoothScrollService {
  private readonly zone = inject(NgZone);
  private started = false;

  async start(): Promise<void> {
    if (this.started) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    this.started = true;

    const [{ default: Lenis }, { gsap, ScrollTrigger }] = await Promise.all([
      import('lenis'),
      import('./motion'),
    ]);
    this.zone.runOutsideAngular(() => {
      const lenis = new Lenis({ duration: 1.05, wheelMultiplier: 0.9, anchors: { offset: -80 } });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    });
  }
}
