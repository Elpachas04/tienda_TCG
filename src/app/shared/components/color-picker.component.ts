import { Component, Input, Output, EventEmitter, signal, inject, ElementRef, HostListener } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Color } from '../../core/models/product.model';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  host: { style: 'display: contents' },
  imports: [NgTemplateOutlet],
  template: `
    <div class="relative select-none">

      @if (layout === 'block') {
        <!-- ── BLOCK: botón ancho, dropdown hacia abajo (detalle de producto) ── -->
        <button
          type="button"
          class="w-full flex items-center gap-2.5 px-3 py-2.5 bg-lv-black border rounded-lg transition-colors duration-150 focus:outline-none"
          [class]="isOpen() ? 'border-lv-gold' : 'border-lv-border hover:border-lv-gold/50'"
          (click)="toggle()">

          @if (selected) {
            <span class="w-5 h-5 rounded-full flex-shrink-0 border-2 border-white/25 shadow-sm"
                  [style.background-color]="selected.hex">
            </span>
          } @else {
            <span class="w-5 h-5 rounded-full flex-shrink-0 border-2 border-dashed border-lv-border/70"></span>
          }
          <span class="flex-1 text-sm font-body text-left truncate"
                [class]="selected ? 'text-lv-cream' : 'text-lv-muted/60'">
            {{ selected?.name ?? 'Elige un color' }}
          </span>
          <svg class="w-4 h-4 text-lv-muted/50 flex-shrink-0 transition-transform duration-200"
               [class.rotate-180]="isOpen()"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        @if (isOpen()) {
          <div class="absolute top-full left-0 right-0 mt-1.5 bg-lv-surface border border-lv-border rounded-xl shadow-2xl z-50 overflow-hidden animate-dropdown-in">
            <div class="p-2 gap-0.5"
                 [class]="columns === 1 ? 'grid grid-cols-1' : 'grid grid-cols-2'">
              @for (color of colors; track color.id) {
                <ng-container *ngTemplateOutlet="colorRow; context: { $implicit: color }"></ng-container>
              }
            </div>
            <ng-container *ngTemplateOutlet="clearBtn"></ng-container>
          </div>
        }

      } @else {
        <!-- ── INLINE: trigger compacto, dropdown hacia arriba (cards del catálogo) ── -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 max-w-full focus:outline-none"
          (click)="toggle()">

          @if (selected) {
            <span class="w-5 h-5 rounded-full flex-shrink-0 border-2 border-white/25 shadow-sm"
                  [style.background-color]="selected.hex">
            </span>
          } @else {
            <span class="w-5 h-5 rounded-full flex-shrink-0 border-2 border-dashed border-lv-border/70"></span>
          }
          <span class="text-xs font-body truncate max-w-[5.5rem]"
                [class]="selected ? 'text-lv-cream' : 'text-lv-muted/60'">
            {{ selected?.name ?? 'Color' }}
          </span>
          <svg class="w-3 h-3 text-lv-muted/50 flex-shrink-0 transition-transform duration-200"
               [class.rotate-180]="isOpen()"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        @if (isOpen()) {
          <div class="absolute bottom-full left-0 mb-2 w-48 bg-lv-surface border border-lv-border rounded-xl shadow-2xl z-50 overflow-hidden animate-dropdown-in">
            <div class="p-2 grid grid-cols-1 gap-0.5">
              @for (color of colors; track color.id) {
                <ng-container *ngTemplateOutlet="colorRow; context: { $implicit: color }"></ng-container>
              }
            </div>
            <ng-container *ngTemplateOutlet="clearBtn"></ng-container>
          </div>
        }
      }

    </div>

    <!-- plantilla reutilizable para cada fila de color -->
    <ng-template #colorRow let-color>
      <button
        type="button"
        class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors duration-100"
        [class]="selected?.id === color.id ? 'bg-lv-gold/10' : 'hover:bg-lv-border'"
        (click)="pick(color)">
        <span
          class="w-5 h-5 rounded-full flex-shrink-0 border-2 transition-all duration-150"
          [style.background-color]="color.hex"
          [class]="selected?.id === color.id ? 'border-lv-gold scale-110 shadow-md' : 'border-white/20'">
        </span>
        <span class="text-xs font-body truncate"
              [class]="selected?.id === color.id ? 'text-lv-gold' : 'text-lv-muted'">
          {{ color.name }}
        </span>
        @if (selected?.id === color.id) {
          <svg class="w-3.5 h-3.5 text-lv-gold flex-shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
        }
      </button>
    </ng-template>

    <!-- plantilla para "quitar selección" -->
    <ng-template #clearBtn>
      @if (selected) {
        <div class="border-t border-lv-border px-3 py-2">
          <button
            type="button"
            class="w-full text-xs font-body text-lv-muted/40 hover:text-lv-muted transition-colors text-center"
            (click)="pick(null)">
            Quitar selección
          </button>
        </div>
      }
    </ng-template>
  `
})
export class ColorPickerComponent {
  @Input({ required: true }) colors: Color[] = [];
  @Input() selected: Color | null = null;
  @Input() columns: 1 | 2 = 2;
  @Input() layout: 'block' | 'inline' = 'block';
  @Output() selectedChange = new EventEmitter<Color | null>();

  private el = inject(ElementRef);
  readonly isOpen = signal(false);

  toggle() {
    this.isOpen.update(v => !v);
  }

  pick(color: Color | null) {
    const next = color && this.selected?.id === color.id ? null : color;
    this.selectedChange.emit(next);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: Event) {
    if (event.target instanceof HTMLElement && !this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
