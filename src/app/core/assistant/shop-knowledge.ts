// Respuestas sobre la tienda y cada producto, sacadas SOLO de los datos del catálogo y del proceso real.
// No hay IA ni servicio externo: se detecta el tema por palabras clave y se compone la respuesta.
// Si algo no está en los datos, no se inventa: se manda a WhatsApp.
import { Color, Product, ProductAddon, ShopSettings } from '../models/product.model';
import { WHATSAPP_URL } from '../../shared/constants';

export interface Answer {
  text: string;
  link?: { label: string; url: string; external?: boolean };
}

export interface Knowledge {
  products: readonly Product[];
  colors: readonly Color[];
  addons: readonly ProductAddon[];
  settings: Readonly<ShopSettings>;
}

export type Topic =
  | 'price' | 'colors' | 'size' | 'capacity' | 'time' | 'shipping' | 'payment' | 'leader'
  | 'cards' | 'stock' | 'tracking' | 'custom' | 'addons' | 'sleeves' | 'what' | 'contact' | 'returns';

// Palabras (ya normalizadas: minúsculas y sin tildes) que delatan cada tema
const TOPIC_WORDS: Record<Topic, string[]> = {
  price:    ['precio', 'precios', 'cuesta', 'cuanto vale', 'euros', 'caro', 'barato', 'coste'],
  colors:   ['color', 'colores', 'negro', 'blanco', 'rojo', 'verde', 'azul', 'morado', 'amarillo'],
  size:     ['medida', 'medidas', 'tamano', 'dimension', 'alto', 'ancho', 'largo', 'cm', 'grande', 'pequena', 'mediana'],
  capacity: ['caben', 'cabe', 'capacidad', 'cuantas cartas', 'cartas caben', 'cuantas', 'cuantos', 'que cabe', 'cual necesito', 'para un mazo'],
  time:     ['tarda', 'tardas', 'plazo', 'cuando llega', 'dias', 'cuanto tiempo', 'fabricacion', 'fabricar', 'rapido'],
  shipping: ['envio', 'enviar', 'envias', 'correos', 'recoger', 'recogida', 'en mano', 'gastos', 'peninsula', 'baleares', 'canarias', 'domicilio'],
  payment:  ['pago', 'pagar', 'bizum', 'tarjeta', 'paypal', 'transferencia'],
  leader:   ['lider', 'lideres', 'personaje'],
  cards:    ['incluye cartas', 'vienen cartas', 'trae cartas', 'cartas incluidas', 'con cartas'],
  stock:    ['stock', 'agotado', 'disponible', 'hay unidades'],
  tracking: ['seguimiento', 'mi pedido', 'donde esta', 'estado del pedido', 'numero de pedido'],
  custom:   ['personalizado', 'a medida', 'encargo', 'especial', 'diseno propio', 'grabado', 'logo'],
  addons:   ['separador', 'separadores', 'extra', 'extras', 'anadir'],
  sleeves:  ['funda', 'fundas', 'doble funda', 'enfundado', 'enfundadas', 'toploader', 'toploaders', 'mini snap', 'mini snaps', 'penny', 'perfect fit', 'dragon shield', 'sin funda', 'con funda'],
  what:     ['que es', 'para que sirve', 'que lleva', 'como es', 'caracteristicas', 'que incluye', 'como se usa', 'como funciona'],
  returns:  ['devolucion', 'devoluciones', 'devolver', 'devuelvo', 'reembolso', 'garantia', 'cambiar', 'cambio', 'defecto', 'defectuoso', 'roto', 'rota', 'llega mal', 'llego mal', 'dinero'],
  contact:  ['contacto', 'whatsapp', 'email', 'correo electronico', 'hablar', 'telefono'],
};

export function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,;:()]/g, ' ').replace(/\s+/g, ' ').trim();
}

const num = (n: number) => String(n).replace('.', ',');
const eur = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
const list = (items: string[]) => items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
const whatsapp = (question?: string): Answer['link'] => ({
  label: 'Preguntar por WhatsApp',
  url: question ? `${WHATSAPP_URL}?text=${encodeURIComponent(question)}` : WHATSAPP_URL,
  external: true,
});

/**
 * Qué cabe en cada pieza y con qué fundas. Reglas del vendedor:
 * - Almacenaje (cajas bulk): capacidad contada con cartas SIN funda.
 * - Deckboxes: cartas con doble funda (interior tipo Perfect Fit + exterior tipo Dragon Shield).
 */
export function fitInfo(product: Product): string | null {
  switch (product.id) {
    case 'leader-vault':
      return 'Mazo con doble funda (interior tipo Perfect Fit y encima una Dragon Shield) en un compartimento, y las 10 DON!! en el otro.';
    case 'deckbox-ventana':
      return 'Mazo con doble funda: interior tipo Perfect Fit y encima una Dragon Shield. El Líder va a la vista en la ventana frontal.';
    case 'caja-minisnap':
      return 'Cartas dentro de Mini Snaps (one-touch magnéticos), en fila y sin holgura.';
    case 'deckbox-toploader':
      return 'Cartas dentro de toploaders estándar (3" × 4", tamaño de carta TCG).';
    case 'organizador-fundas':
      return 'Fundas vacías: 30 toploaders en vertical, 45 fundas semirrígidas y un compartimento para penny sleeves.';
    case 'aplastador':
      return 'Mazos enfundados, también con doble funda. Para un mazo de One Piece (50 cartas + Líder) basta la de 60; la de 100 si quieres meter también las DON!! o cartas extra.';
  }
  if (product.category === 'storage') {
    const caps = (product.variants ?? []).filter(v => v.specs?.capacity).map(v => `${v.label.toLowerCase()} ${v.specs!.capacity}`);
    return `La capacidad se cuenta con cartas sin funda${caps.length ? ` (${list(caps)})` : ''}. Con funda caben bastantes menos.`;
  }
  if (product.category === 'deckbox') return 'Mazo con doble funda: interior tipo Perfect Fit y encima una Dragon Shield.';
  return null;
}

type Specific = [RegExp, string, boolean?];
const R = {
  whichSleeves: /(con )?que fundas?|fundas? encaja/,
  sleeves: /doble funda|enfundad|con funda|sin funda|fundas? encaja|que fundas?|perfect fit|dragon shield/,
  don: /\bdon\b/,
  snap: /mini ?snaps?/,
  toploader: /toploaders?/,
  howTo: /como se usa|como funciona|como se utiliza|como lo uso/,
  count: /cuantas cartas|cuantas caben|cuantos caben|capacidad|que cabe/,
  size: /medida|tamano|dimension|\bcm\b|cuanto mide/,
  what: /que es\b|para que sirve/,
};
const NO_CM = 'Las medidas en cm no las tenemos publicadas; te las pasamos por WhatsApp.';

/**
 * Respuestas concretas por producto, revisadas pregunta a pregunta. Van antes que las genéricas.
 * El tercer valor marca las que necesitan el botón de WhatsApp (dato que no está publicado).
 */
const SPECIFIC: Record<string, Specific[]> = {
  'leader-vault': [
    [R.don, 'Sí, las 10 DON!! van en su propio compartimento, separadas del mazo.'],
    [/fichas/, 'Freeze, Tax, Negate, Blocker y Effect Used, imantadas bajo la tapa.'],
    [/otro lider|mi lider|cambiar (el )?lider|con otro/, 'Sí. Ahora está con Yamato, pero te la hacemos con tu Líder por encargo. Escríbenos por WhatsApp.', true],
    [R.whichSleeves, 'Con doble funda: Perfect Fit por dentro y Dragon Shield (o una exterior de tamaño estándar) por fuera.'],
    [R.sleeves, 'Sí, está pensada para doble funda: Perfect Fit por dentro y Dragon Shield por fuera.'],
    [R.size, `${NO_CM} Lo que sí: cabe el mazo con doble funda y las 10 DON!!.`, true],
    [R.count, 'El mazo con doble funda (Perfect Fit + Dragon Shield) en un compartimento y las 10 DON!! en el otro.'],
    [R.what, 'Una deckbox con el Líder a la vista: mazo en un compartimento, DON!! en otro y las fichas de estado imantadas bajo la tapa.'],
  ],
  'deckbox-ventana': [
    [R.don, 'Si además del mazo caben las 10 DON!! no lo tenemos publicado; te lo confirmamos por WhatsApp.', true],
    [/se ve|ventana/, 'Sí, el Líder queda a la vista en la ventana frontal mientras juegas.'],
    [/wanted/, 'Es una barra deslizante con el cartel de WANTED, integrada en la caja. Si quieres verla de cerca, te mandamos fotos por WhatsApp.', true],
    [R.whichSleeves, 'Con doble funda: Perfect Fit por dentro y Dragon Shield (o una exterior de tamaño estándar) por fuera.'],
    [R.sleeves, 'Sí, entra el mazo con Perfect Fit por dentro y Dragon Shield por fuera.'],
    [R.size, `${NO_CM} Lo que sí: cabe el mazo con doble funda.`, true],
    [R.count, 'Tu mazo con doble funda (Perfect Fit + Dragon Shield), con el Líder a la vista en la ventana frontal.'],
    [R.what, 'Una deckbox para el mazo con doble funda, con ventana frontal para lucir el Líder y barra WANTED deslizante.'],
  ],
  'caja-minisnap': [
    [R.toploader, 'Está hecha a medida para Mini Snaps, sin holgura, así que no es para toploaders. Para toploaders tienes la Shutter Vault.'],
    [/cuantos|cuantas|capacidad/, 'Cuántos Mini Snaps entran no lo tenemos publicado; te lo confirmamos por WhatsApp. Lo que sí: van en fila y sin holgura.', true],
    [R.sleeves, 'La caja guarda Mini Snaps, no cartas sueltas: si tu carta enfundada entra en el Mini Snap, el Mini Snap entra en la caja.'],
    [R.size, `${NO_CM} Lo que sí: está hecha a medida para Mini Snaps.`, true],
    [R.count, 'Cartas dentro de Mini Snaps (one-touch magnéticos), en fila y sin holgura.'],
    [R.what, 'Una caja hecha a medida para Mini Snaps: van en fila, sin holgura, y no se mueven en la mochila.'],
  ],
  'deckbox-toploader': [
    [R.snap, 'Está pensada para toploaders estándar; si entran Mini Snaps no lo tenemos comprobado, te lo confirmamos por WhatsApp. Para Mini Snaps tienes la Tactical Vault.', true],
    [/cuantos|cuantas|capacidad/, 'Cuántos toploaders entran no lo tenemos publicado; te lo confirmamos por WhatsApp. Lo que sí: son toploaders estándar de 3" × 4".', true],
    [R.sleeves, 'La caja guarda toploaders estándar (3" × 4"), no cartas sueltas: si tu carta enfundada entra en el toploader, entra en la caja.'],
    [R.size, `${NO_CM} Lo que sí: es para toploaders estándar de 3" × 4".`, true],
    [R.count, 'Cartas dentro de toploaders estándar (3" × 4").'],
    [R.what, 'Una caja para toploaders con persiana enrollable: los metes, cierras y no se salen ni cogen polvo.'],
  ],
  'organizador-fundas': [
    [R.toploader, '30 toploaders en vertical.'],
    [/cartas/, 'No es para cartas sino para fundas vacías: 30 toploaders en vertical, 45 semirrígidas y un hueco para penny sleeves.'],
    [R.size, `${NO_CM} Lo que sí: caben 30 toploaders, 45 semirrígidas y penny sleeves.`, true],
    [/fundas?|que cabe|capacidad/, 'Fundas vacías: 30 toploaders en vertical, 45 semirrígidas y un hueco para penny sleeves.'],
    [R.what, 'Un organizador para fundas vacías con tres huecos: toploaders, semirrígidas y penny sleeves.'],
  ],
  'aplastador': [
    [/cual necesito|para un mazo|cual me|que tamano/, 'Para 50 cartas + Líder, el de 60 (20 €). Si quieres meter también las 10 DON!!, el de 100 (25 €).'],
    [R.howTo, 'El paso a paso te lo explicamos por WhatsApp. Lo que sí: no lleva tornillos y vale con doble funda.', true],
    [R.whichSleeves, 'Con cartas enfundadas, también con doble funda.'],
    [R.sleeves, 'Sí, es compatible con doble funda.'],
    [R.size, `${NO_CM} Lo que sí: hay versión de 60 y de 100 cartas.`, true],
    [R.count, 'Hay dos tamaños: 60 cartas (20 €) y 100 cartas (25 €), enfundadas. Para un mazo de One Piece basta el de 60; el de 100 si quieres meter también las DON!!.'],
    [R.what, 'Una prensa para aplanar tus cartas enfundadas y quitarles el aire; vale con doble funda y no lleva tornillos.'],
  ],
  'caja-bulk': [
    [/separador/, 'Un pack de 10 separadores para dividir la caja por secciones. Se añaden por 2 € marcándolos en la ficha.'],
    [R.whichSleeves, 'La capacidad (400 / 500 / 650) se cuenta con cartas sin funda. Con funda también caben, pero bastantes menos; si quieres la cifra, te la confirmamos por WhatsApp.', true],
    [R.sleeves, 'Caben, pero la capacidad publicada (400 / 500 / 650) es sin funda; con funda caben bastantes menos. Si quieres la cifra, te la confirmamos por WhatsApp.', true],
    [R.what, 'Cajas bulk apilables de paredes rígidas, en tres tamaños: 400, 500 y 650 cartas sin funda.'],
  ],
};

/** Respuesta concreta para este producto, si la pregunta encaja con alguna revisada */
export function specificAnswer(question: string, product: Product): Answer | null {
  const q = normalize(question);
  const hit = SPECIFIC[product.id]?.find(([re]) => re.test(q));
  if (!hit) return null;
  return { text: hit[1], link: hit[2] ? whatsapp(question || `Hola, una duda sobre el ${product.name}`) : undefined };
}

// Palabras de nombres de producto que también se usan al preguntar por cualquier pieza ("¿con qué fundas…?")
const GENERIC_WORDS = new Set(['fundas', 'funda', 'vault', 'leader', 'caja', 'cajas', 'cartas', 'box']);

/** Producto que se menciona en la pregunta (por nombre o por palabras sueltas del nombre) */
export function findProduct(question: string, products: readonly Product[]): Product | null {
  const q = ` ${normalize(question)} `;
  let best: { p: Product; score: number } | null = null;
  for (const p of products) {
    const name = normalize(p.name);
    let score = q.includes(` ${name} `) ? 10 : 0;
    for (const word of name.split(' ')) if (word.length > 3 && !GENERIC_WORDS.has(word) && q.includes(` ${word}`)) score += 2;
    if (q.includes(normalize(p.id).replace(/-/g, ' '))) score += 5;
    if (score > (best?.score ?? 0)) best = { p, score };
  }
  return best && best.score >= 2 ? best.p : null;
}

export function detectTopics(question: string): Topic[] {
  const q = ` ${normalize(question)} `;
  return (Object.keys(TOPIC_WORDS) as Topic[])
    .map(topic => ({ topic, hits: TOPIC_WORDS[topic].filter(w => q.includes(` ${w}`) || q.includes(`${w} `)).length }))
    .filter(t => t.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map(t => t.topic);
}

/** Variantes que nombra la pregunta ("la grande", "100 cartas"); si no nombra ninguna, todas */
function pickVariants(product: Product, question: string) {
  const q = ` ${normalize(question)} `;
  const all = product.variants ?? [];
  const named = all.filter(v => q.includes(` ${normalize(v.label)}`) || q.includes(` ${normalize(v.label).split(' ')[0]} `));
  return named.length ? named : all;
}

/** Respuesta a un tema, para un producto concreto si se conoce */
export function answerTopic(topic: Topic, k: Knowledge, product: Product | null, question = ''): Answer {
  const days = k.settings.deliveryDays || '3-7 días laborables';
  switch (topic) {
    case 'price': {
      if (!product) return { text: `Los precios van de ${eur(Math.min(...k.products.map(p => p.price)))} a ${eur(Math.max(...k.products.flatMap(p => [p.price, ...(p.variants ?? []).map(v => v.price)])))}. Los ves en cada ficha del catálogo.`, link: { label: 'Ver catálogo', url: '/catalog' } };
      const color = product.colorPickerEnabled ? ' El color no cambia el precio.' : '';
      if (product.variants?.length) return { text: `${pickVariants(product, question).map(v => `${v.label}, ${eur(v.price)}`).join(' · ')}.${color}` };
      return { text: `${eur(product.price)}.${color}` };
    }
    case 'colors': {
      const names = k.colors.map(c => c.name.toLowerCase());
      if (product && !product.colorPickerEnabled) return { text: `${product.name} no tiene selector de color en la web. Si lo quieres en un color concreto, pregúntanos.`, link: whatsapp(question || `Hola, ¿el ${product.name} se puede hacer en otro color?`) };
      return { text: `${product ? `${product.name} se hace` : 'Las piezas con selector de color se hacen'} en ${list(names)}, sin coste extra. Lo eliges en la ficha antes de añadirlo a la cesta.` };
    }
    case 'size':
    case 'capacity': {
      if (!product) return { text: 'Las medidas y la capacidad están en cada ficha. ¿De qué pieza quieres saberlo?', link: { label: 'Ver catálogo', url: '/catalog' } };
      const fit = fitInfo(product);
      const sinFunda = product.category === 'storage' ? ' sin funda' : '';
      const withSpecs = pickVariants(product, question).filter(v => v.specs);
      if (withSpecs.length) {
        return { text: withSpecs.map(v => {
          const s = v.specs!;
          const cap = s.capacity ? `${s.capacity} cartas${sinFunda}` : '';
          return `${v.label}: ${[cap, `${num(s.length_cm)} × ${num(s.width_cm)} × ${num(s.height_cm)} cm`].filter(Boolean).join(', ')}`;
        }).join(' · ') + ' (largo × ancho × alto).' };
      }
      if (fit) {
        if (topic === 'capacity') return { text: fit };
        return {
          text: `${fit} Las medidas exactas en cm te las pasamos por WhatsApp.`,
          link: whatsapp(question || `Hola, ¿qué medidas tiene el ${product.name}?`),
        };
      }
      return { text: `No tengo las medidas exactas de ${product.name} en la web. Te las pasamos por WhatsApp.`, link: whatsapp(question || `Hola, ¿qué medidas tiene el ${product.name}?`) };
    }
    case 'time':
      return { text: `Cada pieza se fabrica cuando haces el pedido: ${days} desde que te confirmamos el pago. Después va por Correos (unos días más) o la recoges en mano.` };
    case 'shipping':
      return { text: 'Enviamos por Correos a la oficina que elijas, solo a Península. El precio depende del código postal y lo ves en el checkout antes de confirmar. También puedes elegir recogida en mano, sin coste: te escribimos por WhatsApp para quedar.' };
    case 'payment':
      return { text: 'Solo Bizum. Al confirmar el pedido te llega un email con el número y el concepto (tu número de pedido). Te confirmamos el pago en menos de 1 hora, de lunes a sábado.' };
    case 'leader': {
      if (product && !product.leaderPickerEnabled) {
        const about = [product.description, ...product.features].find(t => /l[ií]der/i.test(t));
        if (about) return { text: `${about.split(/(?<=\.)\s+/).find(x => /l[ií]der/i.test(x)) ?? about}` };
      }
      const p = product?.leaderPickerEnabled ? product : k.products.find(x => x.leaderPickerEnabled) ?? null;
      if (!p?.leaders?.length) return { text: 'Ninguna pieza del catálogo lleva ahora mismo selector de líder.', link: whatsapp(question) };
      const avail = p.leaders.filter(l => l.available).map(l => l.name);
      const custom = p.customLeaderRequest ? ' Si el tuyo no está, puedes pedirlo a medida.' : '';
      return { text: `${p.name} está disponible con ${list(avail)}.${custom}`, link: p.customLeaderRequest ? whatsapp(`Hola, quiero un ${p.name} con el líder: `) : undefined };
    }
    case 'cards':
      return { text: 'No. Vendemos solo el accesorio impreso en 3D; las cartas no van incluidas.' };
    case 'stock':
      if (product) return { text: product.available ? `Sí: ${product.name} se fabrica bajo pedido, así que no se agota por stock.` : `${product.name} está agotado ahora mismo. Pregúntanos y te decimos cuándo vuelve.`, link: product.available ? undefined : whatsapp(`Hola, ¿cuándo vuelve el ${product.name}?`) };
      return { text: 'Todo se fabrica bajo pedido. Si una pieza sale como agotada, pregúntanos y te decimos cuándo vuelve.' };
    case 'tracking':
      return { text: 'Con el número de pedido del email (LV-…) puedes ver en qué paso está.', link: { label: 'Consultar mi pedido', url: '/seguimiento' } };
    case 'custom':
      return { text: 'Hacemos encargos: otro color, un líder que no está en la lista o una pieza nueva. Cuéntanos qué necesitas y te decimos si es posible y cuánto costaría.', link: whatsapp(question || 'Hola, quiero un encargo especial: ') };
    case 'addons': {
      const ids = product?.available_addons ?? [];
      const addons = k.addons.filter(a => !product || ids.includes(a.id));
      if (!addons.length) return { text: product ? `${product.name} no tiene extras.` : 'Ahora mismo no hay extras.' };
      return { text: `Extras${product ? ` para ${product.name}` : ''}: ${addons.map(a => `${a.name.replace(/^Añadir /, '')} (+${eur(a.price)})`).join(', ')}. Se marcan en la ficha.` };
    }
    case 'sleeves': {
      if (product) {
        const fit = fitInfo(product);
        if (fit) return { text: fit };
        return { text: `No tengo el dato de fundas de ${product.name} en la web. Pregúntanos y te lo confirmamos.`, link: whatsapp(question || `Hola, ¿con qué fundas es compatible el ${product.name}?`) };
      }
      return { text: 'Depende de la pieza: las deckboxes van con doble funda (Perfect Fit + Dragon Shield) y las cajas de almacenaje se cuentan con cartas sin funda. ¿De cuál quieres saberlo?', link: { label: 'Ver catálogo', url: '/catalog' } };
    }
    case 'what':
      if (product) return { text: product.description, link: { label: 'Ver la ficha', url: `/product/${product.id}` } };
      return { text: 'Hacemos accesorios para TCG impresos en 3D: deckboxes, cajas de almacenaje, organizadores y herramientas, uno a uno y en tu color.', link: { label: 'Ver catálogo', url: '/catalog' } };
    case 'returns':
      return {
        text: 'Escríbenos en los 7 días siguientes a recibir el pedido. Si te has arrepentido, nos devuelves la pieza y te damos un vale por el importe para otro producto. Si ha llegado con un defecto o un problema que no depende de ti, lo revisamos, nos la devuelves y te enviamos una nueva. En ningún caso se devuelve el dinero.',
        link: whatsapp(question || 'Hola, mi pedido ha llegado con un problema: '),
      };
    case 'contact':
      return { text: 'Por WhatsApp respondemos en menos de 1 hora (lunes a sábado). También en hola@layervault.es.', link: whatsapp() };
  }
}

/** Frases de la ficha que contienen alguna palabra significativa de la pregunta ("fichas", "WANTED"…) */
function featureMatch(question: string, product: Product): string | null {
  const stop = new Set(['tiene', 'lleva', 'puedo', 'sirve', 'cuanto', 'cuantos', 'cuantas', 'donde', 'como', 'esta', 'este', 'esto', 'para', 'sobre', 'cual', 'cuales']);
  const words = normalize(question).split(' ').filter(w => w.length > 3 && !stop.has(w));
  if (!words.length) return null;
  const match = (t: string) => words.some(w => normalize(t).includes(w));
  // Primero las características (cortas); si ninguna encaja, las frases de la descripción
  const features = product.features.filter(match).map(f => f.endsWith('.') ? f : `${f}.`);
  const hits = features.length ? features : product.description.split(/(?<=\.)\s+/).filter(match);
  return hits.length ? hits.slice(0, 2).join(' ') : null;
}

/** Respuesta a una pregunta libre */
export function answer(question: string, k: Knowledge, pageProduct: Product | null): Answer {
  const q = normalize(question);
  if (/^(vale|ok|gracias|muchas gracias|vale gracias|perfecto|genial|guay)( .*)?$/.test(q) && q.split(' ').length <= 4) {
    return { text: 'De nada. Si te queda alguna duda, pregunta cuando quieras.' };
  }
  if (/^(hola|buenas|hey|buenos dias|buenas tardes|buenas noches)$/.test(q)) {
    return { text: 'Hola. Pregúntame por precios, medidas, colores, plazos, envío o pago.' };
  }
  const named = findProduct(question, k.products);
  const product = named ?? pageProduct;
  const res = answerFor(question, k, product);
  // En la ficha se sobreentiende el producto; si se pregunta por otro, se nombra
  if (product && named && named !== pageProduct && !res.text.includes(product.name)) return { ...res, text: `${product.name}: ${res.text}` };
  return res;
}

function answerFor(question: string, k: Knowledge, product: Product | null): Answer {
  const specific = product && specificAnswer(question, product);
  if (specific) return specific;
  const topics = detectTopics(question);
  // "¿Caben con doble funda?" va de fundas aunque diga "caben"
  if (topics.includes('sleeves') && product) return answerTopic('sleeves', k, product, question);
  if (topics.length) return answerTopic(topics[0], k, product, question);
  if (product) {
    const hit = featureMatch(question, product);
    if (hit) return { text: hit };
  }
  if (product && findProduct(question, k.products)) return answerTopic('what', k, product, question);
  return {
    text: 'No tengo la respuesta a eso en la web. Escríbenos y te contestamos en menos de 1 hora (lunes a sábado).',
    link: whatsapp(question),
  };
}

export interface FaqItem { q: string; topic: Topic; a: Answer }

/** Preguntas frecuentes de una ficha, solo las que tienen respuesta con datos */
export function productFaq(product: Product, k: Knowledge): FaqItem[] {
  const items: [string, Topic][] = [];
  if (product.variants?.some(v => v.specs)) items.push(['¿Qué medidas tiene y cuántas cartas caben?', 'size']);
  else if (fitInfo(product)) items.push(['¿Qué cabe dentro?', 'capacity']);
  if (product.category === 'deckbox') items.push(['¿Caben con doble funda?', 'sleeves']);
  if (product.colorPickerEnabled) items.push(['¿En qué colores se puede hacer?', 'colors']);
  if (product.leaderPickerEnabled && product.leaders?.length) items.push(['¿Qué líderes hay?', 'leader']);
  items.push(
    ['¿Cuánto cuesta?', 'price'],
    ['¿Incluye cartas?', 'cards'],
    ['¿Cuánto tarda?', 'time'],
    ['¿Cómo es el envío?', 'shipping'],
    ['¿Cómo se paga?', 'payment'],
    ['¿Se puede devolver?', 'returns'],
  );
  return items.map(([q, topic]) => ({ q, topic, a: specificAnswer(q, product) ?? answerTopic(topic, k, product) }));
}

/** Preguntas frecuentes fuera de las fichas */
export function generalFaq(k: Knowledge): FaqItem[] {
  const items: [string, Topic][] = [
    ['¿Qué vendéis?', 'what'],
    ['¿Cuánto tarda un pedido?', 'time'],
    ['¿Cómo es el envío?', 'shipping'],
    ['¿Cómo se paga?', 'payment'],
    ['¿Hacéis encargos personalizados?', 'custom'],
    ['¿Dónde está mi pedido?', 'tracking'],
    ['¿Se puede devolver?', 'returns'],
  ];
  return items.map(([q, topic]) => ({ q, topic, a: answerTopic(topic, k, null) }));
}
