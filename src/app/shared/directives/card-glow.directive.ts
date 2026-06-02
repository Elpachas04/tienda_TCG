import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[lvCardGlow]',
  standalone: true,
})
export class CardGlowDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.renderer.setStyle(this.el.nativeElement, '--mouse-x', `${event.clientX - rect.left}px`);
    this.renderer.setStyle(this.el.nativeElement, '--mouse-y', `${event.clientY - rect.top}px`);
  }
}
