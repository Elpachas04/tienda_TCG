import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CONTACT_EMAIL } from '../../shared/constants';
import { SHIPPING } from '../../shared/constants/shop-policy';
import { EurPipe } from '../../shared/pipes/eur.pipe';

type LegalTab = 'aviso' | 'privacidad' | 'cookies';

/**
 * Todo lo que la web guarda en el navegador de un cliente. Si añades una clave de localStorage/sessionStorage o una
 * cookie, añádela aquí: la ley obliga a informar de ella. Si no es estrictamente necesaria, además hay que pedir
 * consentimiento antes de guardarla (ver docs/tecnico/cookies.md).
 */
const BROWSER_STORAGE = [
  { name: 'tcg3d_cart',   purpose: 'Recordar los productos de tu cesta entre visitas.', duration: 'Hasta que haces el pedido o vacías la cesta.' },
  { name: 'berry_active', purpose: 'Recordar que has activado el descuento ₿erry.', duration: 'Hasta que cierras la pestaña.' },
  { name: 'berry_shown',  purpose: 'No repetirte el aviso del descuento ₿erry.', duration: 'Hasta que cierras la pestaña.' },
  { name: 'berry_spent',  purpose: 'Recordar que ya usaste el descuento ₿erry, que es de un solo uso.', duration: 'Hasta que borras los datos del navegador.' },
] as const;

@Component({
  selector: 'app-legal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EurPipe],
  host: { class: 'block animate-fade-up' },
  template: `
    <div class="bg-lv-black min-h-screen px-6 py-20">
      <div class="max-w-2xl mx-auto">

        <a routerLink="/"
           class="inline-flex items-center gap-2 font-body text-[13px] text-lv-cream/60 hover:text-lv-gold transition-colors duration-200 mb-12">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver
        </a>

        <!-- Tabs -->
        <nav aria-label="Información legal" class="flex flex-wrap gap-2 mb-12">
          @for (t of tabs; track t.id) {
            <a [routerLink]="t.path" replaceUrl
               class="font-body text-[13px] rounded-full px-5 py-2 transition-all duration-200"
               [class]="tab() === t.id ? 'bg-lv-gold text-black font-semibold' : 'liquid-glass border border-lv-gold/20 text-lv-cream/60 hover:border-lv-gold/40'"
               [attr.aria-current]="tab() === t.id ? 'page' : null">
              {{ t.label }}
            </a>
          }
        </nav>

        @if (tab() === 'aviso') {
          <div class="space-y-8">
            <div>
              <h1 class="lv-h1 text-lv-cream">Información legal</h1>
            </div>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Titular</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSICE), se facilitan los siguientes datos:
              </p>
              <ul class="space-y-1.5 font-body text-sm text-lv-cream/60">
                <li><span class="text-lv-cream/60 font-body text-[13px] ">Titular:</span> LayerVault</li>
                <li><span class="text-lv-cream/60 font-body text-[13px] ">Actividad:</span> Fabricación y venta de accesorios impresos en 3D para juegos de cartas coleccionables</li>
                <li><span class="text-lv-cream/60 font-body text-[13px] ">Domicilio:</span> Barcelona, España</li>
                <li><span class="text-lv-cream/60 font-body text-[13px] ">Email:</span> {{ email }}</li>
              </ul>
            </section>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Objeto y uso del sitio</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                LayerVault es una tienda de venta directa de accesorios fabricados bajo demanda mediante impresión 3D. Todos los productos se fabrican por encargo, uno a uno, de forma artesanal. El pedido se formaliza a través del formulario web; el pago se realiza por Bizum una vez que confirmamos los detalles contigo por email.
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Proceso de pedido y pago</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Al enviar el formulario recibirás un email de confirmación con el resumen de tu pedido. Nos pondremos en contacto contigo en menos de 1 hora para coordinar el pago por Bizum y resolver cualquier duda. El pedido no se fabrica hasta que el pago está confirmado.
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Envíos y devoluciones</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Los envíos se realizan únicamente a Península mediante Correos, con entrega en oficina Correos. El envío cuesta {{ shipping.price | eur }} y es gratis en pedidos desde {{ shipping.freeFrom | eur }} de artículos. También es posible la recogida en mano sin coste. El plazo de fabricación es de 3 a 7 días laborables desde la confirmación del pago.
              </p>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Dado que los productos se fabrican por encargo, no se reembolsa el importe de ningún pedido. Para cualquier devolución, contacta en los 7 días siguientes a la recepción escribiendo a <a [href]="'mailto:' + email" class="text-lv-gold hover:underline">{{ email }}</a>. Si el comprador se arrepiente de la compra, devuelve la pieza y recibe un vale por el mismo importe para otro producto de la tienda. Si la pieza llega con un defecto de fabricación o un problema ajeno al comprador, se revisa el caso y, si procede, el comprador la devuelve y se le envía una nueva.
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Propiedad intelectual</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                El diseño, imágenes, textos y modelos 3D publicados en este sitio son propiedad de LayerVault. Queda prohibida su reproducción, distribución o uso comercial sin autorización expresa.
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Legislación aplicable</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Las presentes condiciones se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de Barcelona.
              </p>
            </section>
          </div>
        }

        @if (tab() === 'privacidad') {
          <div class="space-y-8">
            <div>
              <h1 class="lv-h1 text-lv-cream">Privacidad</h1>
            </div>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Responsable del tratamiento</h2>
              <ul class="space-y-1.5 font-body text-sm text-lv-cream/60">
                <li><span class="text-lv-cream/60 font-body text-[13px] ">Responsable:</span> LayerVault</li>
                <li><span class="text-lv-cream/60 font-body text-[13px] ">Email:</span> {{ email }}</li>
              </ul>
            </section>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Datos que recogemos</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Únicamente los datos que tú proporcionas al realizar un pedido: nombre, email y teléfono (todos obligatorios) y código postal (solo cuando eliges envío a domicilio). No se recogen datos de navegación ni se usa analítica ni publicidad. Lo poco que la web guarda en tu navegador, como tu cesta, se explica en <a routerLink="/cookies" class="text-lv-gold hover:underline">cookies</a>.
              </p>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Si valoras tu pedido, guardamos la puntuación, el comentario, las fotos que subas y el nombre del pedido. Solo se publican si las aprobamos, y el nombre aparece tapado salvo las primeras y últimas letras (por ejemplo, «Mar******ez»). Puedes pedirnos que las borremos cuando quieras.
              </p>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Si pides que te avisemos cuando vuelva un producto agotado, guardamos tu email solo para eso: te escribimos una vez y lo borramos.
              </p>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Si en el checkout marcas «recordádmelo por email», guardamos tu nombre, tu email y el contenido de tu cesta para escribirte una sola vez si no terminas el pedido. Se borran al hacer el pedido, al desmarcar la casilla, desde el enlace del propio email o, como tarde, a los 7 días. Para no repetir el recordatorio guardamos además, durante 30 días, una huella cifrada de tu email que no permite recuperarlo.
              </p>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Cuando las invitaciones están activas, al entregarte un pedido te damos un código personal para invitar a otras personas. Guardamos tu nombre y tu email junto a ese código para poder enviarte el vale cuando alguien lo use, y una huella cifrada del email de quien lo usa para que cada persona solo pueda usar una invitación. Puedes pedirnos que lo borremos cuando quieras.
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Finalidad y base legitimadora</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Tus datos se usan exclusivamente para gestionar, fabricar y entregar tu pedido, y para enviarte la confirmación por email. La base legal es la ejecución del contrato de compraventa (art. 6.1.b RGPD). El recordatorio de cesta y el aviso de reposición se basan en tu consentimiento (art. 6.1.a RGPD), que puedes retirar en cualquier momento.
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Servicios que intervienen</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Para gestionar los pedidos se utilizan los siguientes servicios externos, cada uno con su propia política de privacidad:
              </p>
              <ul class="space-y-1.5 font-body text-sm text-lv-cream/60">
                <li><span class="text-lv-cream/60 font-body text-[13px] ">Brevo</span> — envío del email de confirmación al cliente.</li>
                <li><span class="text-lv-cream/60 font-body text-[13px] ">Notion</span> — registro interno de pedidos (nombre, email, resumen del pedido).</li>
                <li><span class="text-lv-cream/60 font-body text-[13px] ">Telegram</span> — notificación interna al vendedor del nuevo pedido.</li>
                <li><span class="text-lv-cream/60 font-body text-[13px] ">Cloudinary</span> — alojamiento de las fotos que subes con tu valoración.</li>
                <li><span class="text-lv-cream/60 font-body text-[13px] ">Netlify</span> — alojamiento de la web y de las valoraciones.</li>
                <li><span class="text-lv-cream/60 font-body text-[13px] ">Correos España</span> — gestión del envío cuando eliges esta modalidad de entrega.</li>
              </ul>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                No se ceden datos a ningún otro tercero ni se usan con fines publicitarios o de perfilado.
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Conservación</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Los datos se conservan durante el tiempo necesario para gestionar el pedido y atender posibles reclamaciones (máximo 1 año desde la entrega).
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Tus derechos</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a <a [href]="'mailto:' + email" class="text-lv-gold hover:underline">{{ email }}</a>. Si consideras que el tratamiento no es conforme, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).
              </p>
            </section>
          </div>
        }

        @if (tab() === 'cookies') {
          <div class="space-y-8">
            <div>
              <h1 class="lv-h1 text-lv-cream">Cookies</h1>
            </div>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Lo esencial</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Esta web solo guarda en tu navegador lo necesario para que funcione lo que tú pides, como recordar tu cesta. No usamos cookies de analítica, de publicidad ni de terceros, y no seguimos lo que haces en otras webs.
              </p>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Por eso no verás un aviso pidiéndote permiso: la ley exime de consentimiento a lo que es estrictamente necesario para prestar un servicio que has solicitado (art. 22.2 de la Ley 34/2002, LSSI). Aun así, te contamos qué es cada cosa.
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Qué guardamos</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Son datos propios de LayerVault guardados en el almacenamiento de tu navegador. No se envían a nadie ni sirven para identificarte.
              </p>
              <ul class="rounded-card border border-lv-border divide-y divide-lv-border" aria-label="Datos que la web guarda en tu navegador">
                @for (item of storage; track item.name) {
                  <li class="px-4 py-4 space-y-1.5">
                    <code class="font-body text-sm text-lv-cream">{{ item.name }}</code>
                    <p class="font-body text-sm text-lv-cream/60 leading-relaxed">{{ item.purpose }}</p>
                    <p class="font-body text-[13px] text-lv-cream/60"><span class="text-lv-cream/80">Dura:</span> {{ item.duration }}</p>
                  </li>
                }
              </ul>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                El panel de gestión de la tienda usa además una cookie de sesión (<code class="font-body text-lv-cream">admin_session</code>, 7 días) y una marca (<code class="font-body text-lv-cream">lv_admin</code>). Solo existen si entras como vendedor; a los clientes no se les instalan.
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Servicios externos</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                La web está alojada en Netlify y las fotos de los productos se cargan desde Cloudinary. Para enseñarte la página reciben los datos técnicos de cualquier visita (como tu dirección IP); no les pedimos que guarden nada en tu navegador ni los usamos para medir o perfilar visitas.
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Cómo borrarlas</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Puedes borrar estos datos cuando quieras desde los ajustes de tu navegador («Borrar datos de navegación» o «Datos de sitios web»). Si lo haces, se vaciará tu cesta.
              </p>
            </section>

            <section class="space-y-3">
              <h2 class="lv-h3 text-lv-cream">Cambios</h2>
              <p class="font-body text-sm text-lv-cream/60 leading-relaxed">
                Si algún día añadimos analítica u otras cookies que no sean necesarias, te pediremos permiso antes de usarlas y actualizaremos esta página. Para cualquier duda, escríbenos a <a [href]="'mailto:' + email" class="text-lv-gold hover:underline">{{ email }}</a>.
              </p>
            </section>
          </div>
        }

        <p class="font-body text-xs text-lv-cream/60 mt-16 pt-8 border-t border-lv-gold/10">
          Última actualización: octubre 2026
        </p>

      </div>
    </div>
  `,
})
export class LegalComponent {
  protected readonly tabs: ReadonlyArray<{ id: LegalTab; path: string; label: string }> = [
    { id: 'aviso',      path: '/legal',      label: 'Aviso legal' },
    { id: 'privacidad', path: '/privacidad', label: 'Privacidad' },
    { id: 'cookies',    path: '/cookies',    label: 'Cookies' },
  ];
  private readonly url = inject(Router).url;
  protected readonly tab = signal<LegalTab>(
    this.url.startsWith('/privacidad') ? 'privacidad' : this.url.startsWith('/cookies') ? 'cookies' : 'aviso'
  );
  protected readonly storage = BROWSER_STORAGE;
  protected readonly email = CONTACT_EMAIL;
  protected readonly shipping = SHIPPING;
}
