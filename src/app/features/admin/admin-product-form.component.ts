import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product, ProductVariant, Leader, ProductCategory } from '../../core/models/product.model';
import { AdminCatalogService } from '../../core/services/admin-catalog.service';

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

const CATEGORIES: ProductCategory[] = ['deckbox', 'storage', 'tools', 'accessories'];
const BADGE_STYLES = ['gold', 'teal', 'purple', 'coral'] as const;
const INPUT = 'w-full bg-white/[0.03] border border-lv-border rounded-xl px-3 py-2 font-body text-sm text-lv-cream focus:outline-none focus:border-lv-gold/40 transition-colors';
const LABEL = 'block font-mono text-[10px] uppercase tracking-widest text-lv-muted mb-1.5';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/70 flex items-start justify-center overflow-y-auto z-50 py-8 px-4">
      <div class="liquid-glass rounded-card border border-lv-border w-full max-w-2xl p-6 sm:p-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="font-display text-2xl text-lv-cream uppercase tracking-wide">{{ isNew ? 'Nuevo producto' : 'Editar producto' }}</h2>
          <button type="button" class="text-lv-muted hover:text-lv-cream" (click)="cancelled.emit()">✕</button>
        </div>

        @if (error()) {
          <p class="text-red-400/80 font-mono text-[10px] uppercase tracking-wider mb-4">{{ error() }}</p>
        }

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label [class]="LABEL">ID (slug único) *</label>
            <input [class]="INPUT" [(ngModel)]="form.id" [disabled]="!isNew" name="id" placeholder="mi-producto" />
          </div>
          <div>
            <label [class]="LABEL">SKU</label>
            <input [class]="INPUT" [(ngModel)]="form.sku" name="sku" placeholder="ABC" />
          </div>
          <div>
            <label [class]="LABEL">Nombre *</label>
            <input [class]="INPUT" [(ngModel)]="form.name" name="name" />
          </div>
          <div>
            <label [class]="LABEL">Precio base (€) *</label>
            <input type="number" step="0.01" min="0" [class]="INPUT" [(ngModel)]="form.price" name="price" />
          </div>
          <div class="col-span-2">
            <label [class]="LABEL">Tagline</label>
            <input [class]="INPUT" [(ngModel)]="form.tagline" name="tagline" />
          </div>
          <div>
            <label [class]="LABEL">Categoría</label>
            <select [class]="INPUT" [(ngModel)]="form.category" name="category">
              @for (cat of categories; track cat) { <option [value]="cat">{{ cat }}</option> }
            </select>
          </div>
          <div>
            <label [class]="LABEL">Badge</label>
            <input [class]="INPUT" [(ngModel)]="form.badge" name="badge" placeholder="Nuevo, Premium..." />
          </div>
          <div>
            <label [class]="LABEL">Estilo del badge</label>
            <select [class]="INPUT" [(ngModel)]="form.badgeStyle" name="badgeStyle">
              <option [ngValue]="null">— ninguno —</option>
              @for (style of badgeStyles; track style) { <option [value]="style">{{ style }}</option> }
            </select>
          </div>
          <div>
            <label [class]="LABEL">Video (public ID, opcional)</label>
            <input [class]="INPUT" [(ngModel)]="form.video" name="video" />
          </div>
          <div class="col-span-2">
            <label [class]="LABEL">Descripción</label>
            <textarea [class]="INPUT + ' resize-none'" rows="3" [(ngModel)]="form.description" name="description"></textarea>
          </div>
        </div>

        <!-- Features -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-2">
            <label [class]="LABEL + ' mb-0'">Características</label>
            <button type="button" class="font-mono text-[10px] uppercase text-lv-gold hover:underline" (click)="addFeature()">+ Añadir</button>
          </div>
          <div class="space-y-2">
            @for (f of form.features; track $index) {
              <div class="flex gap-2">
                <input [class]="INPUT" [(ngModel)]="form.features[$index]" [name]="'feature' + $index" />
                <button type="button" class="text-red-400/70 hover:text-red-400 px-2" (click)="removeFeature($index)">✕</button>
              </div>
            }
          </div>
        </div>

        <!-- Imágenes -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-2">
            <label [class]="LABEL + ' mb-0'">Imágenes</label>
            <label class="font-mono text-[10px] uppercase text-lv-gold hover:underline cursor-pointer">
              {{ uploading() ? 'Subiendo...' : '+ Subir imagen' }}
              <input type="file" accept="image/*" class="hidden" (change)="onImageSelected($event)" [disabled]="uploading() || !form.id" />
            </label>
          </div>
          @if (!form.id) {
            <p class="font-mono text-[10px] text-lv-muted/60">Define el ID del producto antes de subir imágenes.</p>
          }
          <div class="space-y-2">
            @for (img of form.images; track img; let i = $index) {
              <div class="flex items-center gap-2 bg-white/[0.02] rounded-lg px-3 py-2">
                <span class="font-mono text-[11px] text-lv-cream/70 flex-1 truncate">{{ img }}</span>
                <button type="button" class="text-lv-muted hover:text-lv-cream disabled:opacity-20" [disabled]="i === 0" (click)="moveImage(i, -1)">↑</button>
                <button type="button" class="text-lv-muted hover:text-lv-cream disabled:opacity-20" [disabled]="i === form.images.length - 1" (click)="moveImage(i, 1)">↓</button>
                <button type="button" class="text-red-400/70 hover:text-red-400 px-1" (click)="removeImage(i)">✕</button>
              </div>
            }
          </div>
        </div>

        <!-- Toggles -->
        <div class="mt-6 grid grid-cols-2 gap-3">
          <label class="flex items-center gap-2 font-mono text-xs text-lv-cream/80">
            <input type="checkbox" [(ngModel)]="form.available" name="available" /> Disponible
          </label>
          <label class="flex items-center gap-2 font-mono text-xs text-lv-cream/80">
            <input type="checkbox" [(ngModel)]="form.hidden" name="hidden" /> Oculto en catálogo
          </label>
          <label class="flex items-center gap-2 font-mono text-xs text-lv-cream/80">
            <input type="checkbox" [(ngModel)]="form.colorPickerEnabled" name="colorPickerEnabled" /> Selector de color
          </label>
          <label class="flex items-center gap-2 font-mono text-xs text-lv-cream/80">
            <input type="checkbox" [ngModel]="!!form.leaderPickerEnabled" (ngModelChange)="form.leaderPickerEnabled = $event" name="leaderPickerEnabled" /> Selector de líder
          </label>
        </div>

        <!-- Addons -->
        @if (availableAddons.length > 0) {
          <div class="mt-6">
            <label [class]="LABEL">Addons disponibles</label>
            <div class="flex flex-wrap gap-3">
              @for (addon of availableAddons; track addon.id) {
                <label class="flex items-center gap-1.5 font-mono text-[11px] text-lv-cream/70">
                  <input type="checkbox" [checked]="isAddonSelected(addon.id)" (change)="toggleAddon(addon.id)" /> {{ addon.name }}
                </label>
              }
            </div>
          </div>
        }

        <!-- Variantes -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-2">
            <label [class]="LABEL + ' mb-0'">Variantes</label>
            <button type="button" class="font-mono text-[10px] uppercase text-lv-gold hover:underline" (click)="addVariant()">+ Añadir variante</button>
          </div>
          <div class="space-y-3">
            @for (variant of form.variants ?? []; track $index) {
              <div class="border border-lv-border rounded-xl p-3 space-y-2">
                <div class="grid grid-cols-3 gap-2">
                  <input [class]="INPUT" placeholder="Etiqueta" [(ngModel)]="variant.label" [name]="'vlabel' + $index" />
                  <input type="number" step="0.01" [class]="INPUT" placeholder="Precio" [(ngModel)]="variant.price" [name]="'vprice' + $index" />
                  <label class="flex items-center gap-1.5 font-mono text-[11px] text-lv-cream/70">
                    <input type="radio" name="defaultVariant" [checked]="!!variant.default" (change)="setDefaultVariant($index)" /> Por defecto
                  </label>
                </div>
                <div class="flex justify-end">
                  <button type="button" class="text-red-400/70 hover:text-red-400 font-mono text-[10px] uppercase" (click)="removeVariant($index)">Eliminar variante</button>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Leaders -->
        @if (form.leaderPickerEnabled) {
          <div class="mt-6">
            <div class="flex items-center justify-between mb-2">
              <label [class]="LABEL + ' mb-0'">Líderes</label>
              <button type="button" class="font-mono text-[10px] uppercase text-lv-gold hover:underline" (click)="addLeader()">+ Añadir líder</button>
            </div>
            <div class="space-y-2">
              @for (leader of form.leaders ?? []; track $index) {
                <div class="flex gap-2 items-center">
                  <input [class]="INPUT" placeholder="ID" [(ngModel)]="leader.id" [name]="'lid' + $index" />
                  <input [class]="INPUT" placeholder="Nombre" [(ngModel)]="leader.name" [name]="'lname' + $index" />
                  <label class="flex items-center gap-1 font-mono text-[10px] text-lv-cream/70 whitespace-nowrap">
                    <input type="checkbox" [(ngModel)]="leader.available" [name]="'lavail' + $index" /> Disp.
                  </label>
                  <button type="button" class="text-red-400/70 hover:text-red-400 px-1" (click)="removeLeader($index)">✕</button>
                </div>
              }
            </div>
            <label class="flex items-center gap-2 font-mono text-xs text-lv-cream/80 mt-2">
              <input type="checkbox" [ngModel]="!!form.customLeaderRequest" (ngModelChange)="form.customLeaderRequest = $event" name="customLeaderRequest" /> Permitir solicitud de líder personalizado
            </label>
          </div>
        }

        <div class="flex justify-end gap-3 mt-8">
          <button type="button" class="font-mono text-xs uppercase tracking-widest text-lv-muted hover:text-lv-cream px-4 py-2.5" (click)="cancelled.emit()">Cancelar</button>
          <button type="button"
            class="bg-lv-gold hover:brightness-110 text-black font-mono text-xs uppercase tracking-widest font-semibold rounded-full px-6 py-2.5 disabled:opacity-50"
            [disabled]="!isValid()"
            (click)="save()">
            Guardar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AdminProductFormComponent {
  private readonly catalogService = inject(AdminCatalogService);

  protected readonly LABEL = LABEL;
  protected readonly INPUT = INPUT;
  protected readonly categories = CATEGORIES;
  protected readonly badgeStyles = BADGE_STYLES;

  @Input()
  set product(value: Product | null) {
    this.form   = value ? structuredClone(value) : blankProduct();
    this.isNew  = !value;
  }

  @Output() saved     = new EventEmitter<Product>();
  @Output() cancelled = new EventEmitter<void>();

  form: Product = blankProduct();
  isNew = true;
  uploading = signal(false);
  error     = signal('');

  get availableAddons() {
    return this.catalogService.catalog()?.addons ?? [];
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

  removeImage(i: number): void { this.form.images = this.form.images.filter((_, idx) => idx !== i); }
  moveImage(i: number, dir: -1 | 1): void {
    const images = [...this.form.images];
    const target = i + dir;
    if (target < 0 || target >= images.length) return;
    [images[i], images[target]] = [images[target], images[i]];
    this.form.images = images;
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.form.id) return;

    this.uploading.set(true);
    this.error.set('');
    try {
      const dataBase64 = await this.readFileAsBase64(file);
      const sequence = String((this.form.images.length + 1)).padStart(2, '0');
      const publicId = await this.catalogService.uploadImage(this.form.id, dataBase64, sequence);
      if (publicId) {
        this.form.images = [...this.form.images, publicId];
      } else {
        this.error.set('No se pudo subir la imagen');
      }
    } catch {
      this.error.set('No se pudo subir la imagen');
    } finally {
      this.uploading.set(false);
    }
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  addVariant(): void { this.form.variants = [...(this.form.variants ?? []), blankVariant()]; }
  removeVariant(i: number): void { this.form.variants = (this.form.variants ?? []).filter((_, idx) => idx !== i); }
  setDefaultVariant(i: number): void {
    this.form.variants = (this.form.variants ?? []).map((v, idx) => ({ ...v, default: idx === i }));
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
