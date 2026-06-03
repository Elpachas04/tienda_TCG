import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CONTACT_EMAIL } from '../../shared/constants';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [RouterLink],
  host: { class: 'block animate-fade-up' },
  template: `
    <div class="bg-lv-black min-h-screen px-6 py-20">
      <div class="max-w-2xl mx-auto">

        <a routerLink="/"
           class="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-lv-cream/40 hover:text-lv-gold transition-colors duration-200 mb-12">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver
        </a>

        <!-- Tabs -->
        <div class="flex gap-2 mb-12">
          <button
            class="font-mono text-xs uppercase tracking-wider rounded-full px-5 py-2 transition-all duration-200"
            [class]="tab() === 'aviso' ? 'bg-lv-gold text-black font-semibold' : 'liquid-glass border border-lv-gold/20 text-lv-cream/50 hover:border-lv-gold/40'"
            (click)="tab.set('aviso')">
            Aviso legal
          </button>
          <button
            class="font-mono text-xs uppercase tracking-wider rounded-full px-5 py-2 transition-all duration-200"
            [class]="tab() === 'privacidad' ? 'bg-lv-gold text-black font-semibold' : 'liquid-glass border border-lv-gold/20 text-lv-cream/50 hover:border-lv-gold/40'"
            (click)="tab.set('privacidad')">
            Privacidad
          </button>
        </div>

        @if (tab() === 'aviso') {
          <div class="prose-lv space-y-8">
            <div>
              <p class="font-mono text-xs uppercase tracking-[0.3em] text-lv-gold/60 mb-3">— Aviso Legal</p>
              <h1 class="font-display uppercase text-4xl text-lv-cream leading-none">Información legal</h1>
            </div>

            <section class="space-y-3">
              <h2 class="font-display text-xl text-lv-gold uppercase">Titular</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSICE), se facilitan los siguientes datos:
              </p>
              <ul class="space-y-1.5 font-body text-sm text-lv-cream/60">
                <li><span class="text-lv-cream/40 font-mono text-[11px] uppercase tracking-wider">Titular:</span> Antony Pachas</li>
                <li><span class="text-lv-cream/40 font-mono text-[11px] uppercase tracking-wider">Actividad:</span> Fabricación y venta de accesorios impresos en 3D para juegos de cartas coleccionables</li>
                <li><span class="text-lv-cream/40 font-mono text-[11px] uppercase tracking-wider">Domicilio:</span> Barcelona, España</li>
                <li><span class="text-lv-cream/40 font-mono text-[11px] uppercase tracking-wider">Email:</span> {{ email }}</li>
              </ul>
            </section>

            <section class="space-y-3">
              <h2 class="font-display text-xl text-lv-gold uppercase">Objeto y uso del sitio</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                LayerVault es una tienda de venta directa de accesorios fabricados bajo demanda mediante impresión 3D. Todos los productos se fabrican por encargo y de forma artesanal. Los pedidos se gestionan mediante Telegram y correo electrónico; el pago se realiza por Bizum o transferencia bancaria una vez confirmado el pedido.
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="font-display text-xl text-lv-gold uppercase">Propiedad intelectual</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                El diseño, imágenes, textos y modelos 3D publicados en este sitio son propiedad de LayerVault. Queda prohibida su reproducción, distribución o uso comercial sin autorización expresa.
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="font-display text-xl text-lv-gold uppercase">Envíos y devoluciones</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Los envíos se realizan únicamente a Península mediante Correos iPaq domicilio. Dado que los productos se fabrican por encargo, no se admiten devoluciones salvo en caso de defecto de fabricación acreditado. En ese supuesto, contacta en los 7 días siguientes a la recepción a través de Telegram o email.
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="font-display text-xl text-lv-gold uppercase">Legislación aplicable</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Las presentes condiciones se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de Barcelona.
              </p>
            </section>
          </div>
        }

        @if (tab() === 'privacidad') {
          <div class="space-y-8">
            <div>
              <p class="font-mono text-xs uppercase tracking-[0.3em] text-lv-gold/60 mb-3">— Política de Privacidad</p>
              <h1 class="font-display uppercase text-4xl text-lv-cream leading-none">Privacidad</h1>
            </div>

            <section class="space-y-3">
              <h2 class="font-display text-xl text-lv-gold uppercase">Responsable del tratamiento</h2>
              <ul class="space-y-1.5 font-body text-sm text-lv-cream/60">
                <li><span class="text-lv-cream/40 font-mono text-[11px] uppercase tracking-wider">Responsable:</span> Antony Pachas</li>
                <li><span class="text-lv-cream/40 font-mono text-[11px] uppercase tracking-wider">Email:</span> {{ email }}</li>
              </ul>
            </section>

            <section class="space-y-3">
              <h2 class="font-display text-xl text-lv-gold uppercase">Datos que recogemos</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Únicamente los datos que tú proporcionas al realizar un pedido: nombre, dirección de email o teléfono, y código postal (cuando eliges envío). No se recogen datos de navegación, cookies propias ni se usa ningún sistema de analítica.
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="font-display text-xl text-lv-gold uppercase">Finalidad y base legitimadora</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Tus datos se usan exclusivamente para gestionar y coordinar tu pedido. La base legal es la ejecución del contrato de compraventa (art. 6.1.b RGPD).
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="font-display text-xl text-lv-gold uppercase">Conservación</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Los datos se conservan durante el tiempo necesario para gestionar el pedido y, en su caso, atender posibles reclamaciones (máximo 1 año desde la entrega).
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="font-display text-xl text-lv-gold uppercase">Cesión a terceros</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                No se ceden datos a terceros salvo a Correos España, exclusivamente para gestionar el envío cuando lo solicitas, y en cumplimiento de obligaciones legales. Los pedidos se comunican a través de Telegram; al usar ese canal, se aplica la política de privacidad de Telegram (telegram.org).
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="font-display text-xl text-lv-gold uppercase">Tus derechos</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a <a [href]="'mailto:' + email" class="text-lv-gold hover:underline">{{ email }}</a>. Si consideras que el tratamiento no es conforme, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).
              </p>
            </section>
          </div>
        }

        <p class="font-mono text-[10px] uppercase tracking-wider text-lv-cream/20 mt-16 pt-8 border-t border-lv-gold/10">
          Última actualización: junio 2026
        </p>

      </div>
    </div>
  `,
})
export class LegalComponent {
  protected readonly tab   = signal<'aviso' | 'privacidad'>(
    inject(Router).url.includes('privacidad') ? 'privacidad' : 'aviso'
  );
  protected readonly email = CONTACT_EMAIL;
}
