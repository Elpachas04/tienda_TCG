import { Directive, ElementRef, AfterViewInit, OnDestroy, inject } from '@angular/core';

@Directive({
  selector: '[lvReveal]',
  standalone: true,
  host: { class: 'lv-reveal' },
})
export class RevealDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private observer!: IntersectionObserver;

  ngAfterViewInit(): void {
    // rAF ensures the element is painted before observing
    requestAnimationFrame(() => {
      this.observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              this.observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.05 }
      );
      this.observer.observe(this.el.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
