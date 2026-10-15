import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Product } from '../../core/models/product.model';
import { AdminCatalogService } from '../../core/services/admin-catalog.service';
import { CloudinaryService } from '../../core/services/cloudinary.service';
import { AdminProductFormComponent, CATEGORY_LABELS } from './admin-product-form.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminProductFormComponent],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 class="font-display text-3xl text-lv-cream">Productos</h1>
        <p class="font-body text-sm text-lv-muted mt-1">
          {{ products().length }} productos · el orden de esta lista es el orden del catálogo
        </p>
      </div>
      <button type="button"
        class="bg-lv-cream hover:bg-white text-lv-black font-body text-sm font-semibold rounded-full px-5 py-2.5"
        (click)="openNew()">
        + Nuevo producto
      </button>
    </div>

    @if (saveError()) {
      <p class="rounded-xl border border-red-400/30 bg-red-400/5 text-red-300 font-body text-sm px-4 py-3 mb-6">{{ saveError() }}</p>
    }

    @if (catalogService.loading()) {
      <p class="font-body text-sm text-lv-muted">Cargando productos…</p>
    } @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        @for (product of products(); track product.id; let i = $index; let first = $first; let last = $last) {
          <article class="rounded-card border border-lv-border bg-lv-surface/60 overflow-hidden flex flex-col"
                   [class.opacity-60]="product.hidden">
            <button type="button" class="relative block aspect-[4/3] bg-lv-black overflow-hidden" (click)="openEdit(product)"
                    [attr.aria-label]="'Editar ' + product.name">
              @if (product.images[0] && !brokenCovers().has(product.id)) {
                <img [src]="cloudinary.card(product.images[0])" [alt]="product.name"
                     class="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300" loading="lazy"
                     (error)="markBrokenCover(product.id)" />
              } @else {
                <span class="absolute inset-0 grid place-items-center font-body text-sm"
                      [class]="product.images[0] ? 'text-amber-300' : 'text-lv-muted'">
                  {{ product.images[0] ? 'La portada no existe en Cloudinary' : 'Sin fotos' }}
                </span>
              }
              <span class="absolute top-2 left-2 rounded-full bg-black/70 text-lv-cream font-body text-xs px-2 py-0.5">{{ i + 1 }}</span>
              @if (product.images.length > 1) {
                <span class="absolute top-2 right-2 rounded-full bg-black/70 text-lv-cream font-body text-xs px-2 py-0.5">{{ product.images.length }} fotos</span>
              }
            </button>

            <div class="p-4 flex-1 flex flex-col gap-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="font-display text-lg text-lv-cream leading-tight truncate">{{ product.name }}</h2>
                  <p class="font-body text-xs text-lv-muted mt-0.5">{{ categoryLabels[product.category] }}@if (product.badge) { · {{ product.badge }} }</p>
                </div>
                <p class="lv-price font-body text-lg font-semibold text-lv-cream whitespace-nowrap">{{ formatPrice(product.price) }}</p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button type="button" class="rounded-full border px-3 py-1 font-body text-xs transition-colors"
                        [class]="product.hidden ? 'border-lv-border text-lv-muted hover:text-lv-cream' : 'border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10'"
                        [disabled]="busy()" (click)="toggle(product, 'hidden')"
                        [attr.aria-label]="product.hidden ? 'Mostrar en la tienda' : 'Ocultar de la tienda'">
                  {{ product.hidden ? 'Oculto' : 'Visible' }}
                </button>
                <button type="button" class="rounded-full border px-3 py-1 font-body text-xs transition-colors"
                        [class]="product.available ? 'border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10' : 'border-amber-400/40 text-amber-300 hover:bg-amber-400/10'"
                        [disabled]="busy()" (click)="toggle(product, 'available')"
                        [attr.aria-label]="product.available ? 'Marcar como agotado' : 'Marcar como disponible'">
                  {{ product.available ? 'Disponible' : 'Agotado' }}
                </button>
              </div>

              <div class="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-lv-border">
                <div class="flex gap-1">
                  <button type="button" class="w-9 h-9 grid place-items-center rounded-lg text-lv-cream/70 hover:text-lv-cream hover:bg-white/[0.05] disabled:opacity-20"
                          aria-label="Subir en el orden" [disabled]="first || busy()" (click)="move(i, -1)">↑</button>
                  <button type="button" class="w-9 h-9 grid place-items-center rounded-lg text-lv-cream/70 hover:text-lv-cream hover:bg-white/[0.05] disabled:opacity-20"
                          aria-label="Bajar en el orden" [disabled]="last || busy()" (click)="move(i, 1)">↓</button>
                </div>
                <div class="flex gap-1">
                  <button type="button" class="rounded-lg px-3 py-2 font-body text-sm text-red-300 hover:text-red-300 hover:bg-white/[0.04]"
                          [disabled]="busy()" (click)="remove(product)">Eliminar</button>
                  <button type="button" class="rounded-lg px-4 py-2 font-body text-sm font-semibold bg-white/[0.06] text-lv-cream hover:bg-white/[0.1]"
                          (click)="openEdit(product)">Editar</button>
                </div>
              </div>
            </div>
          </article>
        } @empty {
          <p class="font-body text-sm text-lv-muted">No hay productos todavía.</p>
        }
      </div>
    }

    @if (editing() !== undefined) {
      <app-admin-product-form
        [product]="editing() ?? null"
        [saveError]="saveError()"
        (saved)="onSave($event)"
        (cancelled)="closeForm()" />
    }
  `,
})
export class AdminProductsComponent implements OnInit {
  protected readonly catalogService = inject(AdminCatalogService);
  protected readonly cloudinary = inject(CloudinaryService);
  protected readonly categoryLabels = CATEGORY_LABELS;

  // undefined = cerrado · null = creando · Product = editando
  editing   = signal<Product | null | undefined>(undefined);
  saveError = signal('');
  busy      = signal(false);
  brokenCovers = signal<ReadonlySet<string>>(new Set());

  markBrokenCover(id: string): void {
    this.brokenCovers.update(set => new Set(set).add(id));
  }

  products = () => this.catalogService.catalog()?.products ?? [];

  async ngOnInit(): Promise<void> {
    if (!this.catalogService.catalog()) {
      await this.catalogService.load().catch(() => this.saveError.set('No se pudieron cargar los productos.'));
    }
  }

  formatPrice(price: number): string {
    return price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  }

  openNew(): void { this.saveError.set(''); this.editing.set(null); }
  openEdit(product: Product): void { this.saveError.set(''); this.editing.set(product); }
  closeForm(): void { this.saveError.set(''); this.editing.set(undefined); }

  async onSave(product: Product): Promise<void> {
    const current = [...this.products()];
    const idx = current.findIndex(p => p.id === product.id);
    const creating = this.editing() === null;
    if (creating && idx !== -1) {
      this.saveError.set(`Ya existe un producto con el ID "${product.id}". Cámbialo en Opciones avanzadas.`);
      return;
    }
    if (!creating && idx === -1) {
      this.saveError.set('No se encontró el producto a editar.');
      return;
    }
    if (creating) current.push(product);
    else current[idx] = product;
    if (await this.persist(current, 'No se pudo guardar el producto.')) this.closeForm();
  }

  async toggle(product: Product, field: 'hidden' | 'available'): Promise<void> {
    const current = this.products().map(p => p.id === product.id ? { ...p, [field]: !p[field] } : p);
    await this.persist(current, 'No se pudo cambiar el estado.');
  }

  async remove(product: Product): Promise<void> {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    await this.persist(this.products().filter(p => p.id !== product.id), 'No se pudo eliminar el producto.');
  }

  async move(i: number, dir: -1 | 1): Promise<void> {
    const current = [...this.products()];
    const target = i + dir;
    if (target < 0 || target >= current.length) return;
    [current[i], current[target]] = [current[target], current[i]];
    await this.persist(current, 'No se pudo reordenar.');
  }

  private async persist(products: Product[], errorMessage: string): Promise<boolean> {
    this.busy.set(true);
    this.saveError.set('');
    try {
      const ok = await this.catalogService.saveProducts(products);
      if (!ok) this.saveError.set(errorMessage);
      return ok;
    } catch {
      this.saveError.set(errorMessage);
      return false;
    } finally {
      this.busy.set(false);
    }
  }
}
