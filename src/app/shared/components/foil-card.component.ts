import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, NgZone,
  afterNextRender, inject, input, signal, viewChild,
} from '@angular/core';

type OrientationEventCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

type Mode = 'idle' | 'pointer' | 'tilt';

// Grados de inclinación del móvil que recorren el brillo de un borde al otro
const TILT_RANGE = 36;

@Component({
  selector: 'lv-foil-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div #stage class="foil-stage">
      <div #card class="foil" (click)="enableTilt()">
        <div class="foil-top font-mono">
          <span>{{ eyebrow() }}</span><span>Hecho en BCN</span>
        </div>
        <div class="foil-window">
          <img [src]="image()" [alt]="name()" width="700" height="700" fetchpriority="high" draggable="false">
        </div>
        <div class="foil-bottom">
          <strong class="font-display">{{ name() }}</strong>
          <em class="font-mono">{{ price() }} €</em>
        </div>
      </div>
    </div>
    @if (needsPermission()) {
      <p class="hint font-mono">Toca la tarjeta e inclina el móvil</p>
    }
  `,
  styles: [`
    .foil-stage { perspective: 1000px; width: fit-content; margin-inline: auto; }
    .foil {
      --mx: 62%; --my: 30%; --rx: 0deg; --ry: 0deg;
      position: relative;
      width: min(300px, 70vw);
      aspect-ratio: 63 / 88;
      border-radius: 16px;
      overflow: hidden;
      transform: rotateX(var(--rx)) rotateY(var(--ry));
      background: linear-gradient(150deg, #1b1a17 0%, #0f0f0e 70%);
      border: 1px solid rgba(201, 168, 76, .65);
      box-shadow:
        0 40px 70px -25px rgba(0, 0, 0, .9),
        0 0 0 6px #0e0e0e,
        0 0 0 7px rgba(201, 168, 76, .3);
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 12px;
      padding: 16px;
      will-change: transform;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    .foil-top {
      display: flex; justify-content: space-between;
      font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
      color: #C9A84C;
    }
    .foil-window {
      position: relative;
      min-height: 0;
      border-radius: 10px;
      overflow: hidden;
      background: #111;
    }
    /* El brillo vive solo en el marco: la máscara recorta el centro y deja 2px de borde */
    .foil-window::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 2.5px;
      pointer-events: none;
      background: radial-gradient(150px circle at var(--mx) var(--my),
        #fffbef 0%, #f3dc95 12%, #C9A84C 30%, #6b5a26 62%, #3d331b 100%);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }
    .foil-window img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .foil-bottom { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .foil-bottom strong { font-weight: 400; font-size: 26px; line-height: 1; letter-spacing: .02em; color: #F5F0E8; }
    .foil-bottom em { font-style: normal; font-size: 14px; color: #C9A84C; }
    .hint {
      margin-top: 18px; text-align: center;
      font-size: 10px; letter-spacing: .2em; text-transform: uppercase;
      color: rgba(245, 240, 232, .45);
    }
  `],
})
export class FoilCardComponent {
  readonly name = input.required<string>();
  readonly price = input.required<number>();
  readonly image = input.required<string>();
  readonly eyebrow = input('Leader');

  readonly needsPermission = signal(false);

  private readonly card = viewChild.required<ElementRef<HTMLElement>>('card');
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private mode: Mode = 'idle';
  private target = { x: .62, y: .3 };
  private current = { x: .62, y: .3 };
  private baseline: { beta: number; gamma: number } | null = null;
  private visible = true;
  private frame = 0;

  constructor() {
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      this.zone.runOutsideAngular(() => this.start());
    });
  }

  enableTilt(): void {
    const ctor = window.DeviceOrientationEvent as OrientationEventCtor | undefined;
    if (!this.needsPermission() || !ctor?.requestPermission) return;
    ctor.requestPermission()
      .then(state => { if (state === 'granted') this.listenOrientation(); })
      .catch(() => {})
      .finally(() => this.needsPermission.set(false));
  }

  private start(): void {
    const el = this.card().nativeElement;
    // El ratón se mide sobre el contenedor, que no gira: medir sobre la tarjeta girada hace temblar el borde
    const stage = this.stage().nativeElement;

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || this.mode === 'tilt') return;
      const r = stage.getBoundingClientRect();
      this.mode = 'pointer';
      this.target.x = clamp((e.clientX - r.left) / r.width);
      this.target.y = clamp((e.clientY - r.top) / r.height);
    };
    const onLeave = () => { if (this.mode === 'pointer') this.mode = 'idle'; };
    stage.addEventListener('pointermove', onPointer, { passive: true });
    stage.addEventListener('pointerleave', onLeave);

    // Solo en táctiles: algunos portátiles tienen sensor y anularían el seguimiento del ratón
    const touch = matchMedia('(pointer: coarse)').matches;
    const ctor = window.DeviceOrientationEvent as OrientationEventCtor | undefined;
    if (touch && ctor?.requestPermission) {
      // iOS: el permiso solo se puede pedir desde un toque del usuario
      this.zone.run(() => this.needsPermission.set(true));
    } else if (touch && ctor) {
      this.listenOrientation();
    }

    const io = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible && !this.frame) this.frame = requestAnimationFrame(this.tick);
    });
    io.observe(el);

    this.frame = requestAnimationFrame(this.tick);

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.frame);
      io.disconnect();
      stage.removeEventListener('pointermove', onPointer);
      stage.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('deviceorientation', this.onOrientation);
    });
  }

  private listenOrientation(): void {
    this.zone.runOutsideAngular(() =>
      window.addEventListener('deviceorientation', this.onOrientation, { passive: true }),
    );
  }

  private readonly onOrientation = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return;
    this.mode = 'tilt';
    // La referencia se adapta despacio a cómo sostiene el móvil cada persona
    if (!this.baseline) this.baseline = { beta: e.beta, gamma: e.gamma };
    this.baseline.beta += (e.beta - this.baseline.beta) * .01;
    this.baseline.gamma += (e.gamma - this.baseline.gamma) * .01;
    this.target.x = clamp(.5 + (e.gamma - this.baseline.gamma) / TILT_RANGE);
    this.target.y = clamp(.5 + (e.beta - this.baseline.beta) / TILT_RANGE);
  };

  private readonly tick = (now: number) => {
    if (!this.visible) { this.frame = 0; return; }

    if (this.mode === 'idle') {
      const t = now / 1000;
      this.target.x = .5 + Math.sin(t * .6) * .32;
      this.target.y = .45 + Math.cos(t * .45) * .25;
    }

    this.current.x += (this.target.x - this.current.x) * .12;
    this.current.y += (this.target.y - this.current.y) * .12;

    const s = this.card().nativeElement.style;
    s.setProperty('--mx', `${(this.current.x * 100).toFixed(1)}%`);
    s.setProperty('--my', `${(this.current.y * 100).toFixed(1)}%`);
    s.setProperty('--ry', `${((this.current.x - .5) * 14).toFixed(2)}deg`);
    s.setProperty('--rx', `${((.5 - this.current.y) * 10).toFixed(2)}deg`);

    this.frame = requestAnimationFrame(this.tick);
  };
}

function clamp(v: number): number {
  return Math.min(1, Math.max(0, v));
}
