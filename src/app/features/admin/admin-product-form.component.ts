import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product, ProductVariant, Leader, ProductCategory } from '../../core/models/product.model';
import { AdminCatalogService } from '../../core/services/admin-catalog.service';
import { AdminPhotoGridComponent } from './admin-photo-grid.component';

function blankProduct(): Product {
  return {
    id: '', sku: '', name: '', tagline: '', category: 'accessories',
    badge: null, badgeStyle: null, description: '', features: [],
    images: [], price: 0, colorPickerEnabled: false, available: true, hidden: false,
  };
}

function blankVariant(): ProductVariant {
  return { label: '', price: 0 };
}

function blankLeader(): Leader {
  return { id: '', name: '', available: true };
}

function slugify(text: string): string {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  deckbox: 'Deckbox',
  storage: 'Almacenaje',
  tools: 'Herramientas',
  accessories: 'Accesorios',
};

const INPUT = 'w-full bg-white/[0.03] border border-lv-border rounded-xl px-3 py-2.5 font-body text-sm text-lv-cream placeholder:text-lv-cream/60 focus:outline-none focus:border-lv-gold/50 transition-colors';
const LABEL = 'block font-body text-[13px] font-medium text-lv-cream/70 mb-1.5';
const SECTION = 'font-display text-lg text-lv-cream';
const HINT = 'font-body text-xs text-lv-muted mt-1';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AdminPhotoGridComponent],
  template: `
    <div class="fixed inset-0 bg-black/75 flex items-start justify-center overflow-y-auto z-[70] sm:py-8 sm:px-4"
         (keydown.escape)="cancelled.emit()">
      <div class="bg-lv-deep sm:rounded-card border border-lv-border w-full max-w-3xl min-h-screen sm:min-h-0 flex flex-col">

        <header class="flex items-center justify-between gap-4 px-5 sm:px-8 py-5 border-b border-lv-border">
          <div class="min-w-0">
            <h2 class="font-display text-2xl text-lv-cream truncate">{{ isNew ? 'Nuevo producto' : (form.name || 'Editar producto') }}</h2>
            @if (!isNew) { <p class="font-body text-xs text-lv-muted">ID: {{ form.id }}</p> }
          </div>
          <button type="button" class="w-10 h-10 grid place-items-center rounded-full text-lv-muted hover:text-lv-cream hover:bg-white/[0.05]"
                  aria-label="Cerrar" (click)="cancelled.emit()">✕</button>
        </header>

        <div class="flex-1 px-5 sm:px-8 py-6 space-y-10">

          <!-- Fotos -->
          <section class="space-y-8">
            <div>
              @if (form.leaderPickerEnabled) {
                <div class="mb-3">
                  <h3 [class]="SECTION">Portada del catálogo</h3>
                  <p [class]="HINT">Una sola foto, común a todos los líderes: es la que sale en la tarjeta del catálogo y del inicio. Las fotos de cada líder van debajo.</p>
                </div>
              } @else {
                <div class="flex items-baseline justify-between gap-4 mb-3">
                  <h3 [class]="SECTION">Fotos</h3>
                  <p class="font-body text-xs text-lv-muted">La primera es la portada de la tarjeta</p>
                </div>
              }
              <app-admin-photo-grid [images]="form.images" (imagesChange)="form.images = $event"
                                    [productId]="form.id" [max]="form.leaderPickerEnabled ? 1 : 0"
                                    (uploadingChange)="uploading.set($event)" />
              @if (form.leaderPickerEnabled && form.images.length > 1) {
                <p class="font-body text-xs text-amber-300 mt-2">Solo se usa la portada. Las fotos marcadas "No se usa" no se ven en la tienda: quítalas o súbelas en la galería de un líder.</p>
              }
              @if (!form.id) {
                <p [class]="HINT">Escribe primero el nombre del producto para poder subir fotos.</p>
              }
            </div>

            @if (form.leaderPickerEnabled) {
              @for (leader of form.leaders ?? []; track $index) {
                <div>
                  <div class="flex items-baseline justify-between gap-4 mb-3">
                    <h4 class="font-display text-base text-lv-cream">Fotos de {{ leader.name || 'líder sin nombre' }}</h4>
                    <p class="font-body text-xs text-lv-muted">Salen en la ficha al elegir este líder</p>
                  </div>
                  <app-admin-photo-grid [images]="leaderImages(leader)" (imagesChange)="leader.images = $event"
                                        [productId]="form.id" coverLabel="Primera" (uploadingChange)="uploading.set($event)" />
                </div>
              } @empty {
                <p [class]="HINT">Añade líderes en Opciones avanzadas para gestionar sus fotos.</p>
              }
            }

            <p [class]="HINT">Quitar una foto la saca del producto, pero no la borra de Cloudinary.</p>
          </section>

          <!-- Información -->
          <section class="space-y-4">
            <h3 [class]="SECTION">Información</h3>
            <div>
              <label [class]="LABEL" for="pf-name">Nombre *</label>
              <input id="pf-name" [class]="INPUT" [(ngModel)]="form.name" (ngModelChange)="onNameChange($event)" name="name" placeholder="Leader Vault" />
            </div>
            <div>
              <label [class]="LABEL" for="pf-tagline">Frase corta</label>
              <input id="pf-tagline" [class]="INPUT" [(ngModel)]="form.tagline" name="tagline" placeholder="Tu Líder al frente, tu mazo bajo control." />
            </div>
            <div>
              <label [class]="LABEL" for="pf-desc">Descripción</label>
              <textarea id="pf-desc" [class]="INPUT + ' resize-y'" rows="4" [(ngModel)]="form.description" name="description"></textarea>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <span [class]="LABEL + ' mb-0'">Características</span>
                <button type="button" class="font-body text-xs text-lv-gold hover:underline" (click)="addFeature()">+ Añadir</button>
              </div>
              <div class="space-y-2">
                @for (f of form.features; track $index) {
                  <div class="flex gap-2">
                    <input [class]="INPUT" [(ngModel)]="form.features[$index]" [name]="'feature' + $index" [attr.aria-label]="'Característica ' + ($index + 1)" />
                    <button type="button" class="px-3 rounded-xl text-red-300 hover:text-red-300 hover:bg-white/[0.04]" aria-label="Quitar característica" (click)="removeFeature($index)">✕</button>
                  </div>
                } @empty {
                  <p class="font-body text-xs text-lv-muted">Sin características. Salen como lista en la ficha del producto.</p>
                }
              </div>
            </div>
          </section>

          <!-- Precio y estado -->
          <section class="space-y-4">
            <h3 [class]="SECTION">Precio y estado</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label [class]="LABEL" for="pf-price">Precio (€) *</label>
                <input id="pf-price" type="number" step="0.01" min="0" [class]="INPUT" [(ngModel)]="form.price" name="price" />
              </div>
              <div>
                <label [class]="LABEL" for="pf-cat">Categoría</label>
                <select id="pf-cat" [class]="INPUT" [(ngModel)]="form.category" name="category">
                  @for (cat of categories; track cat) { <option [value]="cat">{{ categoryLabels[cat] }}</option> }
                </select>
              </div>
              <div>
                <label [class]="LABEL" for="pf-badge">Etiqueta</label>
                <input id="pf-badge" [class]="INPUT" [(ngModel)]="form.badge" name="badge" placeholder="Nuevo, Premium…" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label class="flex items-start gap-3 rounded-xl border border-lv-border p-3 cursor-pointer hover:border-lv-gold/40">
                <input type="checkbox" class="mt-1" [ngModel]="!form.hidden" (ngModelChange)="form.hidden = !$event" name="visible" />
                <span><span class="block font-body text-sm text-lv-cream">Visible en la tienda</span>
                  <span [class]="HINT">Si lo desmarcas, el producto desaparece del catálogo.</span></span>
              </label>
              <label class="flex items-start gap-3 rounded-xl border border-lv-border p-3 cursor-pointer hover:border-lv-gold/40">
                <input type="checkbox" class="mt-1" [(ngModel)]="form.available" name="available" />
                <span><span class="block font-body text-sm text-lv-cream">Disponible para comprar</span>
                  <span [class]="HINT">Si lo desmarcas, se ve pero sale como agotado.</span></span>
              </label>
              <label class="flex items-start gap-3 rounded-xl border border-lv-border p-3 cursor-pointer hover:border-lv-gold/40">
                <input type="checkbox" class="mt-1" [(ngModel)]="form.colorPickerEnabled" name="colorPickerEnabled" />
                <span><span class="block font-body text-sm text-lv-cream">El cliente elige color</span>
                  <span [class]="HINT">Muestra el selector de colores.</span></span>
              </label>
              <label class="flex items-start gap-3 rounded-xl border border-lv-border p-3 cursor-pointer hover:border-lv-gold/40">
                <input type="checkbox" class="mt-1" [ngModel]="!!form.leaderPickerEnabled" (ngModelChange)="form.leaderPickerEnabled = $event" name="leaderPickerEnabled" />
                <span><span class="block font-body text-sm text-lv-cream">El cliente elige líder</span>
                  <span [class]="HINT">Los líderes se configuran en Opciones avanzadas.</span></span>
              </label>
            </div>
          </section>

          <!-- Avanzado -->
          <details class="group rounded-xl border border-lv-border" [open]="isNew">
            <summary class="cursor-pointer select-none px-4 py-3 font-display text-lg text-lv-cream flex items-center justify-between">
              Opciones avanzadas
              <span class="font-body text-xs text-lv-muted group-open:hidden">ID, variantes, líderes, extras, vídeo</span>
            </summary>
            <div class="px-4 pb-5 pt-2 space-y-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label [class]="LABEL" for="pf-id">ID (en la dirección web)</label>
                  <input id="pf-id" [class]="INPUT" [(ngModel)]="form.id" (ngModelChange)="idTouched = true" [disabled]="!isNew" name="id" placeholder="leader-vault" />
                  <p [class]="HINT">{{ isNew ? 'Se rellena solo con el nombre. No se puede cambiar después.' : 'No se puede cambiar.' }}</p>
                </div>
                <div>
                  <label [class]="LABEL" for="pf-sku">SKU</label>
                  <input id="pf-sku" [class]="INPUT" [(ngModel)]="form.sku" name="sku" placeholder="LDV" />
                  <p [class]="HINT">Código interno; sale en el número de pedido.</p>
                </div>
                <div class="sm:col-span-2">
                  <label [class]="LABEL" for="pf-video">Vídeo de Cloudinary (opcional)</label>
                  <input id="pf-video" [class]="INPUT" [(ngModel)]="form.video" name="video" placeholder="public ID del vídeo" />
                </div>
              </div>

              @if (availableAddons.length > 0) {
                <div>
                  <span [class]="LABEL">Extras disponibles</span>
                  <div class="flex flex-wrap gap-2">
                    @for (addon of availableAddons; track addon.id) {
                      <label class="flex items-center gap-2 rounded-full border border-lv-border px-3 py-1.5 font-body text-[13px] text-lv-cream/80 cursor-pointer hover:border-lv-gold/40">
                        <input type="checkbox" [checked]="isAddonSelected(addon.id)" (change)="toggleAddon(addon.id)" /> {{ addon.name }}
                      </label>
                    }
                  </div>
                </div>
              }

              <div>
                <div class="flex items-center justify-between mb-2">
                  <span [class]="LABEL + ' mb-0'">Variantes</span>
                  <button type="button" class="font-body text-xs text-lv-gold hover:underline" (click)="addVariant()">+ Añadir variante</button>
                </div>
                <div class="space-y-2">
                  @for (variant of form.variants ?? []; track $index) {
                    <div class="grid grid-cols-[1fr_7rem_auto_auto] gap-2 items-center">
                      <input [class]="INPUT" placeholder="Nombre de la variante" [(ngModel)]="variant.label" [name]="'vlabel' + $index" />
                      <input type="number" step="0.01" [class]="INPUT" placeholder="Precio" [(ngModel)]="variant.price" [name]="'vprice' + $index" />
                      <label class="flex items-center gap-1.5 font-body text-xs text-lv-cream/70 whitespace-nowrap">
                        <input type="radio" name="defaultVariant" [checked]="!!variant.default" (change)="setDefaultVariant($index)" /> Por defecto
                      </label>
                      <button type="button" class="px-2 text-red-300 hover:text-red-300" aria-label="Quitar variante" (click)="removeVariant($index)">✕</button>
                    </div>
                  } @empty {
                    <p class="font-body text-xs text-lv-muted">Sin variantes: se vende al precio base.</p>
                  }
                </div>
              </div>

              @if (form.leaderPickerEnabled) {
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span [class]="LABEL + ' mb-0'">Líderes</span>
                    <button type="button" class="font-body text-xs text-lv-gold hover:underline" (click)="addLeader()">+ Añadir líder</button>
                  </div>
                  <div class="space-y-2">
                    @for (leader of form.leaders ?? []; track $index) {
                      <div class="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
                        <input [class]="INPUT" placeholder="ID (yamato)" [(ngModel)]="leader.id" [name]="'lid' + $index" />
                        <input [class]="INPUT" placeholder="Nombre (Yamato)" [(ngModel)]="leader.name" [name]="'lname' + $index" />
                        <label class="flex items-center gap-1 font-body text-xs text-lv-cream/70 whitespace-nowrap">
                          <input type="checkbox" [(ngModel)]="leader.available" [name]="'lavail' + $index" /> Disponible
                        </label>
                        <button type="button" class="px-2 text-red-300 hover:text-red-300" aria-label="Quitar líder" (click)="removeLeader($index)">✕</button>
                      </div>
                    }
                  </div>
                  <label class="flex items-center gap-2 font-body text-[13px] text-lv-cream/80 mt-3">
                    <input type="checkbox" [ngModel]="!!form.customLeaderRequest" (ngModelChange)="form.customLeaderRequest = $event" name="customLeaderRequest" />
                    Permitir pedir un líder personalizado
                  </label>
                </div>
              }
            </div>
          </details>
        </div>

        <footer class="sticky bottom-0 flex items-center justify-between gap-3 px-5 sm:px-8 py-4 border-t border-lv-border bg-lv-deep/95 backdrop-blur sm:rounded-b-card">
          <p class="font-body text-xs text-red-300 min-w-0">{{ error() || saveError }}</p>
          <div class="flex gap-2 flex-shrink-0">
            <button type="button" class="font-body text-sm text-lv-cream/70 hover:text-lv-cream px-4 py-2.5" (click)="cancelled.emit()">Cancelar</button>
            <button type="button"
              class="bg-lv-cream hover:bg-white text-lv-black font-body text-sm font-semibold rounded-full px-6 py-2.5 disabled:opacity-40"
              [disabled]="!isValid() || uploading()"
              (click)="save()">
              Guardar
            </button>
          </div>
        </footer>
      </div>
    </div>
  `,
})
export class AdminProductFormComponent {
  private readonly catalogService = inject(AdminCatalogService);

  protected readonly LABEL = LABEL;
  protected readonly INPUT = INPUT;
  protected readonly SECTION = SECTION;
  protected readonly HINT = HINT;
  protected readonly categories = Object.keys(CATEGORY_LABELS) as ProductCategory[];
  protected readonly categoryLabels = CATEGORY_LABELS;

  @Input()
  set product(value: Product | null) {
    this.form   = value ? structuredClone(value) : blankProduct();
    this.isNew  = !value;
    this.idTouched = !!value;
  }

  /** Error al guardar, lo decide la lista (p. ej. ID repetido) */
  @Input() saveError = '';

  @Output() saved     = new EventEmitter<Product>();
  @Output() cancelled = new EventEmitter<void>();

  form: Product = blankProduct();
  isNew = true;
  idTouched = false;
  uploading      = signal(false);
  error          = signal('');
  get availableAddons() {
    return this.catalogService.catalog()?.addons ?? [];
  }

  onNameChange(name: string): void {
    if (this.isNew && !this.idTouched) this.form.id = slugify(name);
  }

  isAddonSelected(id: string): boolean {
    return (this.form.available_addons ?? []).includes(id);
  }

  toggleAddon(id: string): void {
    const current = this.form.available_addons ?? [];
    this.form.available_addons = current.includes(id)
      ? current.filter(a => a !== id)
      : [...current, id];
  }

  addFeature(): void { this.form.features = [...this.form.features, '']; }
  removeFeature(i: number): void { this.form.features = this.form.features.filter((_, idx) => idx !== i); }

  addVariant(): void { this.form.variants = [...(this.form.variants ?? []), blankVariant()]; }
  removeVariant(i: number): void { this.form.variants = (this.form.variants ?? []).filter((_, idx) => idx !== i); }
  setDefaultVariant(i: number): void {
    this.form.variants = (this.form.variants ?? []).map((v, idx) => ({ ...v, default: idx === i }));
  }

  /** Mismas fotos que muestra la tienda: las del líder o, si no tiene, las generadas por nombre */
  leaderImages(leader: Leader): string[] {
    if (leader.images?.length) return leader.images;
    const key = this.form.leaderImageKey;
    if (!key || !leader.id) return [];
    return [1, 2, 3, 4, 5].map(i => `${key}_${leader.id}_${String(i).padStart(2, '0')}`);
  }

  addLeader(): void { this.form.leaders = [...(this.form.leaders ?? []), blankLeader()]; }
  removeLeader(i: number): void { this.form.leaders = (this.form.leaders ?? []).filter((_, idx) => idx !== i); }

  isValid(): boolean {
    return this.form.id.trim().length > 0 && this.form.name.trim().length > 0 && this.form.price >= 0;
  }

  save(): void {
    if (!this.isValid()) return;
    this.saved.emit(this.form);
  }
}
