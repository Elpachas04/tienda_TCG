import { Directive, ElementRef, OnDestroy, afterNextRender, inject, input } from '@angular/core';

// Los vídeos de las tarjetas solo se descargan y reproducen cuando están en pantalla, y se pausan al salir.
// Con "ahorro de datos", conexión lenta o movimiento reducido se queda el póster (la foto) y no se descarga nada.
@Directive({ selector: 'video[lvLazyVideo]', standalone: true })
export class LazyVideoDirective implements OnDestroy {
  readonly lvLazyVideo = input.required<string>();
  private readonly el = inject<ElementRef<HTMLVideoElement>>(ElementRef);
  private observer?: IntersectionObserver;

  constructor() {
    afterNextRender(() => {
      const video = this.el.nativeElement;
      const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      const slow = !!conn?.saveData || /(^|-)2g|3g/.test(conn?.effectiveType ?? '');
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (slow || reduced || !('IntersectionObserver' in window)) return;

      this.observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          if (!video.src) video.src = this.lvLazyVideo();
          video.play().catch(() => { /* el navegador puede bloquearlo: queda el póster */ });
        } else if (video.src) {
          video.pause();
        }
      }, { rootMargin: '150px 0px', threshold: 0.25 });
      this.observer.observe(video);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
