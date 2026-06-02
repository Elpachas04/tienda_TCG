export interface LvProduct {
  id: string;
  name: string;
  tagline: string;
  category: 'deckboxes' | 'almacenaje' | 'herramientas' | 'accesorios';
  price: string;
  customizable: boolean;
}

export const LANDING_PRODUCTS: LvProduct[] = [
  {
    id: '1',
    name: 'Leader Display Box',
    tagline: 'Haz que tu Líder imponga respeto.',
    category: 'deckboxes',
    price: '20 €',
    customizable: true,
  },
  {
    id: '2',
    name: 'Shutter Vault',
    tagline: 'Cero vuelcos. Cero tirones. Desliza y juega.',
    category: 'deckboxes',
    price: '20 €',
    customizable: true,
  },
  {
    id: '3',
    name: 'Tactical Vault',
    tagline: 'El búnker definitivo para colecciones de élite.',
    category: 'almacenaje',
    price: '25 €',
    customizable: false,
  },
  {
    id: '4',
    name: 'Organizador Fundas',
    tagline: '30 toploaders + 45 semirígidas + cientos de penny.',
    category: 'almacenaje',
    price: '12 €',
    customizable: true,
  },
  {
    id: '5',
    name: 'Stack Vault',
    tagline: 'Organiza por colores. Apila sin límites.',
    category: 'almacenaje',
    price: '10–15 €',
    customizable: true,
  },
  {
    id: '6',
    name: 'Aplastador 60',
    tagline: 'Elimina el aire. Aplana deformaciones.',
    category: 'herramientas',
    price: '20 €',
    customizable: false,
  },
  {
    id: '7',
    name: 'Aplastador 100',
    tagline: 'Para doble enfundado y cartas premium.',
    category: 'herramientas',
    price: '25 €',
    customizable: false,
  },
  {
    id: '8',
    name: 'Llaveros',
    tagline: 'Diseños bicolor exclusivos One Piece.',
    category: 'accesorios',
    price: '4 €',
    customizable: false,
  },
];

export const LANDING_COLORS = [
  { name: 'Negro',       hex: '#1a1a1a' },
  { name: 'Blanco Jade', hex: '#e8e8d0' },
  { name: 'Rojo',        hex: '#c0392b' },
  { name: 'Azul',        hex: '#2471a3' },
  { name: 'Púrpura',     hex: '#7d3c98' },
  { name: 'Verde Bambú', hex: '#27ae60' },
  { name: 'Amarillo',    hex: '#f1c40f' },
];
