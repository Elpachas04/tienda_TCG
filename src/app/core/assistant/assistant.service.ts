import { Injectable, signal } from '@angular/core';

// Estado compartido del asistente: así la ficha puede abrirlo aunque el componente se cargue en diferido.
@Injectable({ providedIn: 'root' })
export class AssistantService {
  readonly open = signal(false);

  show(): void { this.open.set(true); }
  hide(): void { this.open.set(false); }
  toggle(): void { this.open.update(v => !v); }
}
