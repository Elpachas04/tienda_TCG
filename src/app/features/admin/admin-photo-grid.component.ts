import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { AdminCatalogService } from '../../core/services/admin-catalog.service';
import { CloudinaryService } from '../../core/services/cloudinary.service';

// Netlify rechaza cuerpos de más de ~6 MB (y la foto viaja en base64, +33%):
// se reduce en el navegador para que cualquier foto del móvil entre de sobra
const MAX_SIDE = 2000;
const UPLOAD_AS_IS_BYTES = 1_500_000;

@Component({
  selector: 'app-admin-photo-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      @for (img of images; track img; let i = $index; let first = $first; let last = $last) {
        <figure class="group relative rounded-xl overflow-hidden border bg-lv-surface aspect-square"
                [class]="first && coverLabel ? 'border-lv-gold' : 'border-lv-border'">
          @if (broken().has(img)) {
            <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3 text-center">
              <span class="font-body text-[13px] text-amber-300">No encontrada</span>
              <span class="font-body text-xs text-lv-cream/60 break-all">{{ img }}</span>
            </div>
          } @else {
            <img [src]="cloudinary.card(img)" [alt]="'Foto ' + (i + 1)" class="w-full h-full object-cover" loading="lazy" (error)="markBroken(img)" />
          }
          @if (first && coverLabel) {
            <span class="absolute top-2 left-2 rounded-full bg-lv-gold text-lv-black font-body text-[11px] font-semibold px-2 py-0.5">{{ coverLabel }}</span>
          }
          @if (max && i >= max) {
            <span class="absolute top-2 left-2 rounded-full bg-amber-400 text-lv-black font-body text-[11px] font-semibold px-2 py-0.5">No se usa</span>
          }
          <div class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 p-1.5 bg-gradient-to-t from-black/85 to-transparent pt-6">
            <div class="flex gap-1">
              <button type="button" class="w-8 h-8 grid place-items-center rounded-lg bg-black/50 text-lv-cream hover:bg-black/80 disabled:opacity-25"
                      aria-label="Mover a la izquierda" title="Mover a la izquierda" [disabled]="first" (click)="move(i, -1)">←</button>
              <button type="button" class="w-8 h-8 grid place-items-center rounded-lg bg-black/50 text-lv-cream hover:bg-black/80 disabled:opacity-25"
                      aria-label="Mover a la derecha" title="Mover a la derecha" [disabled]="last" (click)="move(i, 1)">→</button>
            </div>
            <div class="flex gap-1">
              @if (!first && coverLabel) {
                <button type="button" class="w-8 h-8 grid place-items-center rounded-lg bg-black/50 text-lv-gold hover:bg-black/80"
                        [attr.aria-label]="'Usar como ' + coverLabel.toLowerCase()" [title]="'Usar como ' + coverLabel.toLowerCase()"
                        (click)="makeFirst(i)">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linejoin="round" d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z"/></svg>
                </button>
              }
              <button type="button" class="w-8 h-8 grid place-items-center rounded-lg bg-black/50 text-red-300 hover:bg-red-500/80 hover:text-white"
                      aria-label="Quitar foto" title="Quitar foto" (click)="remove(i)">✕</button>
            </div>
          </div>
        </figure>
      }

      <label class="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-center px-3 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-lv-gold"
             [class]="dragOver() ? 'border-lv-gold bg-lv-gold/5' : 'border-lv-border hover:border-lv-gold/50'"
             [class.cursor-pointer]="!!productId && !uploading()"
             [class.opacity-50]="!productId"
             (dragover)="onDragOver($event)" (dragleave)="dragOver.set(false)" (drop)="onDrop($event)">
        @if (uploading()) {
          <span class="font-body text-sm text-lv-cream">Subiendo {{ progress() }}…</span>
        } @else {
          <span class="text-2xl text-lv-gold leading-none">{{ full ? '↻' : '+' }}</span>
          <span class="font-body text-[13px] text-lv-cream/80">{{ full ? 'Cambiar foto' : (max === 1 ? 'Añadir foto' : 'Añadir fotos') }}</span>
          <span class="font-body text-xs text-lv-cream/60">o arrástrala{{ max === 1 ? '' : 's' }} aquí</span>
        }
        <input type="file" accept="image/*" [multiple]="max !== 1" class="sr-only"
               [disabled]="uploading() || !productId" (change)="onFilesSelected($event)" />
      </label>
    </div>

    @if (error()) {
      <p class="font-body text-xs text-red-300 mt-2">{{ error() }}</p>
    }
    @if (broken().size) {
      <p class="font-body text-xs text-amber-300 mt-2">
        {{ broken().size === 1 ? 'Hay 1 foto que no existe' : 'Hay ' + broken().size + ' fotos que no existen' }} en Cloudinary. Quítala{{ broken().size === 1 ? '' : 's' }} con ✕ y guarda.
      </p>
    }
  `,
})
export class AdminPhotoGridComponent {
  private readonly catalogService = inject(AdminCatalogService);
  protected readonly cloudinary = inject(CloudinaryService);

  @Input() images: string[] = [];
  /** Carpeta en Cloudinary; sin él no se puede subir */
  @Input() productId = '';
  /** Texto de la etiqueta de la primera foto; vacío = sin portada */
  @Input() coverLabel = 'Portada';
  /** Máximo de fotos útiles (0 = sin límite). Con 1, subir otra sustituye a la actual */
  @Input() max = 0;
  @Output() imagesChange = new EventEmitter<string[]>();
  @Output() uploadingChange = new EventEmitter<boolean>();

  protected readonly uploading = signal(false);
  protected readonly progress  = signal('');
  protected readonly dragOver  = signal(false);
  protected readonly error     = signal('');
  protected readonly broken    = signal<ReadonlySet<string>>(new Set());

  protected get full(): boolean {
    return this.max === 1 && this.images.length >= 1;
  }

  markBroken(img: string): void {
    this.broken.update(set => new Set(set).add(img));
  }

  move(i: number, dir: -1 | 1): void {
    const images = [...this.images];
    const target = i + dir;
    if (target < 0 || target >= images.length) return;
    [images[i], images[target]] = [images[target], images[i]];
    this.emit(images);
  }

  makeFirst(i: number): void {
    const images = [...this.images];
    const [img] = images.splice(i, 1);
    this.emit([img, ...images]);
  }

  remove(i: number): void {
    const removed = this.images[i];
    this.emit(this.images.filter((_, idx) => idx !== i));
    if (this.broken().has(removed)) {
      this.broken.update(set => { const next = new Set(set); next.delete(removed); return next; });
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.productId && !this.uploading()) this.dragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    void this.upload(Array.from(event.dataTransfer?.files ?? []));
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    void this.upload(files);
  }

  private emit(images: string[]): void {
    this.images = images;
    this.imagesChange.emit(images);
  }

  private async upload(files: File[]): Promise<void> {
    const pictures = files.filter(f => f.type.startsWith('image/')).slice(0, this.max === 1 ? 1 : undefined);
    if (!pictures.length || !this.productId || this.uploading()) return;

    this.setUploading(true);
    this.error.set('');
    let failed = 0;
    try {
      // Una a una: el nombre en Cloudinary sale de la hora de subida, así ninguna pisa a otra
      for (const [i, file] of pictures.entries()) {
        this.progress.set(pictures.length > 1 ? `${i + 1} de ${pictures.length}` : '');
        try {
          const publicId = await this.catalogService.uploadImage(this.productId, await prepareImage(file));
          if (publicId) this.emit(this.max === 1 ? [publicId, ...this.images.slice(1)] : [...this.images, publicId]);
          else failed++;
        } catch {
          failed++;
        }
      }
    } finally {
      this.setUploading(false);
      this.progress.set('');
    }
    if (failed) {
      this.error.set(failed === pictures.length
        ? 'No se pudo subir. Prueba con una foto JPG o PNG.'
        : `${failed} de ${pictures.length} fotos no se pudieron subir.`);
    }
  }

  private setUploading(value: boolean): void {
    this.uploading.set(value);
    this.uploadingChange.emit(value);
  }
}

async function prepareImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= UPLOAD_AS_IS_BYTES) {
    bitmap.close();
    return readAsDataUrl(file);
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.88);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
