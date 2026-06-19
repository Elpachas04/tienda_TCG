import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Component({ selector: 'app-gum-gum-berry', standalone: true, template: '' })
export class GumGumBerryComponent {
  constructor() {
    const platformId = inject(PLATFORM_ID);
    const router = inject(Router);
    if (isPlatformBrowser(platformId)) {
      if (localStorage.getItem('berry_spent') === 'true') {
        // Ya canjeado en este dispositivo — redirige sin activar
        router.navigate(['/'], { replaceUrl: true });
        return;
      }
      sessionStorage.setItem('berry_active', 'true');
    }
    router.navigate(['/'], { replaceUrl: true });
  }
}
