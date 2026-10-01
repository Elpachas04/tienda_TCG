import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Product } from '../../core/models/product.model';
import { AdminCatalogService } from '../../core/services/admin-catalog.service';
import { CloudinaryService } from '../../core/services/cloudinary.service';
import { AdminProductFormComponent } from './admin-product-form.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminProductFormComponent],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-display text-3xl text-lv-cream uppercase tracking-wide">Productos</h1>
      <button type="button"
        class="bg-lv-gold hover:brightness-110 text-black font-mono text-xs uppercase tracking-widest font-semibold rounded-full px-5 py-2.5"
        (click)="openNew()">
        + Nuevo producto
      </button>
    </div>

    @if (catalogService.loading()) {
      <p class="font-mono text-xs text-lv-muted uppercase tracking-wider">Cargando…</p>
    } @else if (saveError()) {
      <p class="text-red-400/80 font-mono text-[10px] uppercase tracking-wider mb-4">{{ saveError() }}</p>
    }

    <div class="space-y-2">
      @for (product of products(); track product.id; let i = $index) {
        <div class="liquid-glass border border-lv-border rounded-xl px-4 py-3 flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg overflow-hidden bg-lv-surface flex-shrink-0">
            @if (product.images[0]) {
              <img [src]="cloudinary.thumb(product.images[0])" [alt]="product.name" class="w-full h-full object-cover" />
            }
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-display text-lg text-lv-cream truncate">{{ product.name }}</p>
            <p class="font-mono text-[10px] text-lv-muted uppercase tracking-wider">
              {{ product.sku || '—' }} · {{ product.category }} · {{ product.price.toFixed(2) }}€
              @if (product.hidden) { <span class="text-red-400/70"> · oculto</span> }
              @if (!product.available) { <span class="text-red-400/70"> · agotado</span> }
            </p>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <button type="button" class="text-lv-muted hover:text-lv-cream disabled:opacity-20 px-1" [disabled]="i === 0" (click)="move(i, -1)">↑</button>
            <button type="button" class="text-lv-muted hover:text-lv-cream disabled:opacity-20 px-1" [disabled]="i === products().length - 1" (click)="move(i, 1)">↓</button>
            <button type="button" class="font-mono text-[10px] uppercase text-lv-gold hover:underline px-2" (click)="openEdit(product)">Editar</button>
            <button type="button" class="font-mono text-[10px] uppercase text-red-400/70 hover:text-red-400 px-2" (click)="remove(product)">Eliminar</button>
          </div>
        </div>
      }
      @if (products().length === 0 && !catalogService.loading()) {
        <p class="font-mono text-xs text-lv-muted uppercase tracking-wider">No hay productos todavía.</p>
      }
    </div>

    @if (editing() !== undefined) {
      <app-admin-product-form
        [product]="editing() ?? null"
        (saved)="onSave($event)"
        (cancelled)="editing.set(undefined)" />
    }
  `,
})
export class AdminProductsComponent implements OnInit {
  protected readonly catalogService = inject(AdminCatalogService);
  protected readonly cloudinary = inject(CloudinaryService);

  // undefined = cerrado · null = creando · Product = editando
  editing   = signal<Product | null | undefined>(undefined);
  saveError = signal('');

  products = () => this.catalogService.catalog()?.products ?? [];

  async ngOnInit(): Promise<void> {
    if (!this.catalogService.catalog()) {
      await this.catalogService.load();
    }
  }

  openNew(): void { this.editing.set(null); }
  openEdit(product: Product): void { this.editing.set(product); }

  async onSave(product: Product): Promise<void> {
    this.saveError.set('');
    const current = [...this.products()];
    const idx = current.findIndex(p => p.id === product.id);

    if (idx === -1) {
      current.push(product);
    } else {
      current[idx] = product;
    }

    const ok = await this.catalogService.saveProducts(current);
    if (ok) {
      this.editing.set(undefined);
    } else {
      this.saveError.set('No se pudo guardar el producto');
    }
  }

  async remove(product: Product): Promise<void> {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    const current = this.products().filter(p => p.id !== product.id);
    const ok = await this.catalogService.saveProducts(current);
    if (!ok) this.saveError.set('No se pudo eliminar el producto');
  }

  async move(i: number, dir: -1 | 1): Promise<void> {
    const current = [...this.products()];
    const target = i + dir;
    if (target < 0 || target >= current.length) return;
    [current[i], current[target]] = [current[target], current[i]];
    const ok = await this.catalogService.saveProducts(current);
    if (!ok) this.saveError.set('No se pudo reordenar');
  }
}
