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
  capacity: ['caben', 'cabe', 'capacidad', 'cuantas cartas', 'cartas caben', 'cuantas'],
  time:     ['tarda', 'tardas', 'plazo', 'cuando llega', 'dias', 'cuanto tiempo', 'fabricacion', 'fabricar', 'rapido'],
  shipping: ['envio', 'enviar', 'envias', 'correos', 'recoger', 'recogida', 'en mano', 'gastos', 'peninsula', 'baleares', 'canarias', 'domicilio'],
  payment:  ['pago', 'pagar', 'bizum', 'tarjeta', 'paypal', 'transferencia'],
  leader:   ['lider', 'lideres', 'personaje'],
  cards:    ['incluye cartas', 'vienen cartas', 'trae cartas', 'cartas incluidas', 'con cartas'],
  stock:    ['stock', 'agotado', 'disponible', 'hay unidades'],
  tracking: ['seguimiento', 'mi pedido', 'donde esta', 'estado del pedido', 'numero de pedido'],
  custom:   ['personalizado', 'a medida', 'encargo', 'especial', 'diseno propio', 'grabado', 'logo'],
  addons:   ['separador', 'separadores', 'extra', 'extras', 'anadir'],
  sleeves:  ['funda', 'fundas', 'doble funda', 'enfundado', 'toploader', 'mini snap', 'penny'],
  what:     ['que es', 'para que sirve', 'que lleva', 'como es', 'caracteristicas', 'que incluye'],
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

/** Producto que se menciona en la pregunta (por nombre o por palabras sueltas del nombre) */
export function findProduct(question: string, products: readonly Product[]): Product | null {
  const q = ` ${normalize(question)} `;
  let best: { p: Product; score: number } | null = null;
  for (const p of products) {
    const name = normalize(p.name);
    let score = q.includes(` ${name} `) ? 10 : 0;
    for (const word of name.split(' ')) if (word.length > 3 && q.includes(` ${word}`)) score += 2;
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
      if (product.variants?.length) return { text: `${product.name}: ${pickVariants(product, question).map(v => `${v.label}, ${eur(v.price)}`).join(' · ')}. El color no cambia el precio.` };
      return { text: `${product.name} cuesta ${eur(product.price)}. El color no cambia el precio.` };
    }
    case 'colors': {
      const names = k.colors.map(c => c.name.toLowerCase());
      if (product && !product.colorPickerEnabled) return { text: `${product.name} no tiene selector de color en la web. Si lo quieres en un color concreto, pregúntanos.`, link: whatsapp(question || `Hola, ¿el ${product.name} se puede hacer en otro color?`) };
      return { text: `${product ? `${product.name} se hace` : 'Las piezas con selector de color se hacen'} en ${list(names)}, sin coste extra. Lo eliges en la ficha antes de añadirlo a la cesta.` };
    }
    case 'size':
    case 'capacity': {
      if (!product) return { text: 'Las medidas y la capacidad están en cada ficha. ¿De qué pieza quieres saberlo?', link: { label: 'Ver catálogo', url: '/catalog' } };
      const withSpecs = pickVariants(product, question).filter(v => v.specs);
      if (withSpecs.length) {
        return { text: withSpecs.map(v => {
          const s = v.specs!;
          const cap = s.capacity ? `${s.capacity} cartas, ` : '';
          return `${v.label}: ${cap}${num(s.height_cm)} × ${num(s.length_cm)} × ${num(s.width_cm)} cm`;
        }).join(' · ') + ' (alto × largo × ancho).' };
      }
      const hint = product.features.filter(f => /\d/.test(f));
      if (hint.length) return { text: `${product.name}: ${list(hint.map(h => h.toLowerCase()))}.` };
      return { text: `No tengo las medidas exactas de ${product.name} en la web. Te las pasamos por WhatsApp.`, link: whatsapp(question || `Hola, ¿qué medidas tiene el ${product.name}?`) };
    }
    case 'time':
      return { text: `Cada pieza se fabrica cuando haces el pedido: ${days} desde que te confirmamos el pago. Después va por Correos (unos días más) o la recoges en mano.` };
    case 'shipping':
      return { text: 'Enviamos por Correos a la oficina que elijas, solo a Península. El precio depende del código postal y lo ves en el checkout antes de confirmar. También puedes elegir recogida en mano, sin coste: te escribimos por WhatsApp para quedar.' };
    case 'payment':
      return { text: 'Solo Bizum. Al confirmar el pedido te llega un email con el número y el concepto (tu número de pedido). Te confirmamos el pago en menos de 1 hora, de lunes a sábado.' };
    case 'leader': {
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
        // Frases sueltas de la descripción y características que hablan de fundas, sin repetir
        const sentences = [...product.description.split(/(?<=\.)\s+/), ...product.features.map(f => f.endsWith('.') ? f : `${f}.`)];
        const hits: string[] = [];
        for (const t of sentences) {
          if (!/fund|toploader|snap|penny/i.test(t)) continue;
          if (hits.some(h => normalize(h).includes(normalize(t).replace(/\.$/, '')) || normalize(t).includes(normalize(h).replace(/\.$/, '')))) continue;
          hits.push(t);
        }
        if (hits.length) return { text: `${product.name}: ${hits.slice(0, 2).join(' ')}` };
        return { text: `No tengo el dato de fundas de ${product.name} en la web. Pregúntanos y te lo confirmamos.`, link: whatsapp(question || `Hola, ¿con qué fundas es compatible el ${product.name}?`) };
      }
      return { text: '¿De qué pieza? Cada ficha dice con qué fundas encaja (doble funda, toploaders, Mini Snaps…).', link: { label: 'Ver catálogo', url: '/catalog' } };
    }
    case 'what':
      if (product) return { text: `${product.name}: ${product.description}`, link: { label: 'Ver la ficha', url: `/product/${product.id}` } };
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

/** Respuesta a una pregunta libre */
export function answer(question: string, k: Knowledge, pageProduct: Product | null): Answer {
  const q = normalize(question);
  if (/^(vale|ok|gracias|muchas gracias|vale gracias|perfecto|genial|guay)( .*)?$/.test(q) && q.split(' ').length <= 4) {
    return { text: 'De nada. Si te queda alguna duda, pregunta cuando quieras.' };
  }
  if (/^(hola|buenas|hey|buenos dias|buenas tardes|buenas noches)$/.test(q)) {
    return { text: 'Hola. Pregúntame por precios, medidas, colores, plazos, envío o pago.' };
  }
  const product = findProduct(question, k.products) ?? pageProduct;
  const topics = detectTopics(question);
  if (topics.length) return answerTopic(topics[0], k, product, question);
  if (product && findProduct(question, k.products)) return answerTopic('what', k, product, question);
  return {
    text: 'No tengo la respuesta a eso en la web. Escríbenos y te contestamos en menos de 1 hora (lunes a sábado).',
    link: whatsapp(question),
  };
}

/** Preguntas frecuentes de una ficha, solo las que tienen respuesta con datos */
export function productFaq(product: Product, k: Knowledge): { q: string; a: Answer }[] {
  const faq: { q: string; a: Answer }[] = [];
  if (product.variants?.some(v => v.specs)) faq.push({ q: '¿Qué medidas tiene y cuántas cartas caben?', a: answerTopic('size', k, product) });
  if ([product.description, ...product.features].some(t => /fund|toploader|snap|penny/i.test(t))) faq.push({ q: '¿Con qué fundas encaja?', a: answerTopic('sleeves', k, product) });
  if (product.colorPickerEnabled) faq.push({ q: '¿En qué colores se puede hacer?', a: answerTopic('colors', k, product) });
  if (product.leaderPickerEnabled && product.leaders?.length) faq.push({ q: '¿Qué líderes hay?', a: answerTopic('leader', k, product) });
  faq.push({ q: '¿Incluye cartas?', a: answerTopic('cards', k, product) });
  faq.push({ q: '¿Cuánto tarda?', a: answerTopic('time', k, product) });
  faq.push({ q: '¿Cómo es el envío?', a: answerTopic('shipping', k, product) });
  faq.push({ q: '¿Cómo se paga?', a: answerTopic('payment', k, product) });
  faq.push({ q: '¿Se puede devolver?', a: answerTopic('returns', k, product) });
  return faq;
}
