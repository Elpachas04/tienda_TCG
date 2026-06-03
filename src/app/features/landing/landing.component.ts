import { Component } from '@angular/core';
import { HeroComponent } from './hero.component';
import { ColorsProcessComponent } from './colors-process.component';
import { CtaComponent } from './cta.component';
import { LvFooterComponent } from './lv-footer.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    HeroComponent,
    ColorsProcessComponent,
    CtaComponent,
    LvFooterComponent,
  ],
  host: { class: 'block bg-lv-black text-lv-cream min-h-screen' },
  template: `
    <app-lv-hero />
    <app-lv-colors-process />
    <app-lv-cta />
    <app-lv-footer />
  `,
})
export class LandingComponent {}
