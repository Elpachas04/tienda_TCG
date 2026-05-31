import { Component, Input, Output, EventEmitter, signal, inject, ElementRef, HostListener } from '@angular/core';
import { ProductVariant } from '../../core/models/product.model';

@Component({
  selector: 'app-variant-picker',
  standalone: true,
  host: { style: 'display: contents' },
  template: `
    <div class="relative select-none">

      <button
        type="button"
        class="inline-flex items-center gap-1.5 max-w-full focus:outline-none"
        (click)="toggle()">
        <span class="w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center text-[9px] font-display leading-none transition-colors duration-150"
              [class]="selected ? 'border-tcg-gold text-tcg-gold' : 'border-tcg-border text-tcg-muted'">
          {{ selected ? selected.label.charAt(0).toUpperCase() : '—' }}
        </span>
        <span class="text-xs font-body truncate max-w-[4rem]"
              [class]="selected ? 'text-tcg-text' : 'text-tcg-muted/60'">
          {{ selected ? short(selected.label) : 'Tamaño' }}
        </span>
        <svg class="w-3 h-3 text-tcg-muted/50 flex-shrink-0 transition-transform duration-200"
             [class.rotate-180]="isOpen()"
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      @if (isOpen()) {
        <div class="absolute bottom-full left-0 mb-2 w-44 bg-tcg-surface border border-tcg-border rounded-xl shadow-2xl z-50 overflow-hidden animate-dropdown-in">
          <div class="p-2 grid grid-cols-1 gap-0.5">
            @for (v of variants; track v.label) {
              <button
                type="button"
                class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors duration-100"
                [class]="selected?.label === v.label ? 'bg-tcg-gold/10' : 'hover:bg-tcg-border'"
                (click)="pick(v)">
                <span class="w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center text-[9px] font-display leading-none transition-all duration-150"
                      [class]="selected?.label === v.label ? 'border-tcg-gold text-tcg-gold scale-110' : 'border-tcg-border/60 text-tcg-muted'">
                  {{ v.label.charAt(0).toUpperCase() }}
                </span>
                <span class="text-xs font-body flex-1 truncate"
                      [class]="selected?.label === v.label ? 'text-tcg-gold' : 'text-tcg-muted'">
                  {{ v.label }}
                </span>
              </button>
            }
          </div>
        </div>
      }

    </div>
  `
})
export class VariantPickerComponent {
  @Input({ required: true }) variants: ProductVariant[] = [];
  @Input() selected: ProductVariant | null = null;
  @Output() selectedChange = new EventEmitter<ProductVariant>();

  private el = inject(ElementRef);
  readonly isOpen = signal(false);

  toggle() { this.isOpen.update(v => !v); }

  pick(variant: ProductVariant) {
    this.selectedChange.emit(variant);
    this.isOpen.set(false);
  }

  short(label: string): string {
    const letter = label.charAt(0).toUpperCase();
    const num = label.match(/(\d+)/);
    return num ? `${letter} · ${num[1]}` : letter;
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: Event) {
    if (event.target instanceof HTMLElement && !this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
