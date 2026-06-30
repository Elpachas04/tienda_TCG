import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, signal, inject, ElementRef, HostListener } from '@angular/core';
import { Leader } from '../../core/models/product.model';

@Component({
  selector: 'app-leader-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div class="relative select-none">

      @if (layout === 'block') {
        <button
          type="button"
          class="w-full flex items-center gap-2.5 px-3 py-2.5 bg-lv-black border rounded-lg transition-colors duration-150 focus:outline-none"
          [class]="onlyOneAvailable
            ? 'border-lv-border cursor-default'
            : isOpen() ? 'border-lv-gold' : 'border-lv-border hover:border-lv-gold/50'"
          (click)="toggle()">
          <span class="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center">
            <svg class="w-4 h-4 text-lv-gold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </span>
          <span class="flex-1 text-sm font-body text-left truncate"
                [class]="selected ? 'text-lv-cream' : 'text-lv-muted/60'">
            {{ selected?.name ?? 'Elige un Líder' }}
          </span>
          @if (!onlyOneAvailable) {
            <svg class="w-4 h-4 text-lv-muted/50 flex-shrink-0 transition-transform duration-200"
                 [class.rotate-180]="isOpen()"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          }
        </button>

        @if (isOpen() && !onlyOneAvailable) {
          <div class="absolute top-full left-0 right-0 mt-1.5 bg-lv-surface border border-lv-border rounded-xl shadow-2xl z-50 overflow-hidden animate-dropdown-in max-h-[50vh] overflow-y-auto">
            <div class="p-2 grid grid-cols-1 gap-0.5">
              @for (leader of availableLeaders; track leader.id) {
                <button
                  type="button"
                  class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors duration-100"
                  [class]="selected?.id === leader.id ? 'bg-lv-gold/10' : 'hover:bg-lv-border'"
                  (click)="pick(leader)">
                  <span class="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center">
                    <svg class="w-3.5 h-3.5"
                         [class]="selected?.id === leader.id ? 'text-lv-gold' : 'text-lv-muted/40'"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </span>
                  <span class="text-xs font-body truncate flex-1"
                        [class]="selected?.id === leader.id ? 'text-lv-gold' : 'text-lv-muted'">
                    {{ leader.name }}
                  </span>
                  @if (selected?.id === leader.id) {
                    <svg class="w-3.5 h-3.5 text-lv-gold flex-shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                    </svg>
                  }
                </button>
              }
            </div>
          </div>
        }

      } @else {
        <!-- INLINE: compacto, dropdown hacia arriba (cards) -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 max-w-full focus:outline-none"
          [class]="onlyOneAvailable ? 'cursor-default' : ''"
          (click)="toggle()">
          <svg class="w-3.5 h-3.5 text-lv-gold/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span class="text-xs font-body truncate max-w-[7rem]"
                [class]="selected ? 'text-lv-cream' : 'text-lv-muted/60'">
            {{ selected?.name ?? 'Líder' }}
          </span>
          @if (!onlyOneAvailable) {
            <svg class="w-3 h-3 text-lv-muted/50 flex-shrink-0 transition-transform duration-200"
                 [class.rotate-180]="isOpen()"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          }
        </button>

        @if (isOpen() && !onlyOneAvailable) {
          <div class="absolute bottom-full left-0 mb-2 w-44 bg-lv-surface border border-lv-border rounded-xl shadow-2xl z-50 overflow-hidden animate-dropdown-in">
            <div class="p-2 grid grid-cols-1 gap-0.5">
              @for (leader of availableLeaders; track leader.id) {
                <button
                  type="button"
                  class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors duration-100"
                  [class]="selected?.id === leader.id ? 'bg-lv-gold/10' : 'hover:bg-lv-border'"
                  (click)="pick(leader)">
                  <span class="text-xs font-body truncate flex-1"
                        [class]="selected?.id === leader.id ? 'text-lv-gold' : 'text-lv-muted'">
                    {{ leader.name }}
                  </span>
                  @if (selected?.id === leader.id) {
                    <svg class="w-3 h-3 text-lv-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                    </svg>
                  }
                </button>
              }
            </div>
          </div>
        }
      }

    </div>
  `
})
export class LeaderPickerComponent {
  @Input({ required: true }) leaders: Leader[] = [];
  @Input() selected: Leader | null = null;
  @Input() layout: 'block' | 'inline' = 'block';
  @Output() leaderChange = new EventEmitter<Leader | null>();

  private el = inject(ElementRef);
  readonly isOpen = signal(false);

  get availableLeaders(): Leader[] {
    return this.leaders.filter(l => l.available);
  }

  get onlyOneAvailable(): boolean {
    return this.availableLeaders.length <= 1;
  }

  toggle(): void {
    if (this.onlyOneAvailable) return;
    this.isOpen.update(v => !v);
  }

  pick(leader: Leader): void {
    this.leaderChange.emit(leader);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: Event): void {
    if (event.target instanceof HTMLElement && !this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
