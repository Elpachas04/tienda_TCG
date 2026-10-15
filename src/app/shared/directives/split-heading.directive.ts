import { Directive, ElementRef, DestroyRef, NgZone, afterNextRender, inject, input } from '@angular/core';
import { gsap, SplitText, prefersReducedMotion } from '../../core/motion/motion';

// Titular que entra línea a línea. Fuera del viewport espera a que llegue el scroll.
@Directive({
  selector: '[data-split]',
  standalone: true,
})
export class SplitHeadingDirective {
  readonly splitDelay = input(0);

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const zone = inject(NgZone);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (prefersReducedMotion()) { el.classList.add('split-ready'); return; }
      zone.runOutsideAngular(() => {
        const inView = el.getBoundingClientRect().top < innerHeight * 0.9;
        const split = SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'splitline',
          autoSplit: true,
          onSplit: self => {
            el.classList.add('split-ready');
            return gsap.from(self.lines, {
              yPercent: 105,
              duration: 1,
              ease: 'expo.out',
              stagger: 0.09,
              delay: inView ? this.splitDelay() : 0,
              scrollTrigger: inView ? undefined : { trigger: el, start: 'top 88%', once: true },
            });
          },
        });
        destroyRef.onDestroy(() => split.revert());
      });
    });
  }
}
