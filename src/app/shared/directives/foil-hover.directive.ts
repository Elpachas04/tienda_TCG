import { Directive, ElementRef, NgZone, afterNextRender, inject, DestroyRef } from '@angular/core';

// Pasa la posición del ratón a --mx/--my para que el brillo foil (.foil-frame) la siga
@Directive({
  selector: '[lvFoil]',
  standalone: true,
})
export class FoilHoverDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const zone = inject(NgZone);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const host = this.el.nativeElement;
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        const r = host.getBoundingClientRect();
        host.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        host.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      };
      zone.runOutsideAngular(() => host.addEventListener('pointermove', onMove, { passive: true }));
      destroyRef.onDestroy(() => host.removeEventListener('pointermove', onMove));
    });
  }
}
