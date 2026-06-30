import { Injectable } from '@angular/core';

const CLOUD = 'dew1whfdu';
const BASE  = `https://res.cloudinary.com/${CLOUD}/image/upload`;

// f_auto → sirve WebP/AVIF a navegadores compatibles, JPEG como fallback
// q_auto → Cloudinary elige la calidad óptima según el contenido
// c_fill → recorta para rellenar exactamente las dimensiones sin distorsión

@Injectable({ providedIn: 'root' })
export class CloudinaryService {

  /** Tarjeta del catálogo — cuadrado 360 px, producto completo sin recorte */
  card(publicId: string): string {
    return this.build(publicId, 'f_auto,q_auto:good,c_pad,b_rgb:111111,w_360,h_360');
  }

  /** Imagen principal del detalle de producto — cuadrado 700 px (cubre 2× DPR en col de 350 px) */
  detail(publicId: string): string {
    return this.build(publicId, 'f_auto,q_auto:good,c_pad,b_rgb:111111,w_700,h_700');
  }

  /** Miniatura de galería — cuadrado 120 px, calidad baja (se ve a 56–80 px) */
  thumb(publicId: string): string {
    return this.build(publicId, 'f_auto,q_auto:low,c_pad,b_rgb:111111,w_120,h_120');
  }

  /** Imagen de producto en color específico: {key}_{colorId} */
  colorImage(key: string, colorId: string): string {
    return this.build(`${key}_${colorId}`, 'f_auto,q_auto:good,w_700');
  }


  /** Video optimizado para tarjeta: 480px, sin audio, calidad baja, formato auto */
  video(publicId: string): string {
    if (!publicId) return '';
    return `https://res.cloudinary.com/dew1whfdu/video/upload/w_480,q_auto:low,f_auto,ac_none/${publicId}`;
  }

  private build(publicId: string, transforms: string): string {
    if (!publicId) return '';
    return `${BASE}/${transforms}/${publicId}`;
  }
}

/*
  CONVENCIÓN DE PUBLIC IDs:
  Al subir fotos a Cloudinary, usa esta estructura de carpetas:

    layervault/{product-id}/{n}

  Ejemplos:
    layervault/deckbox-ventana/01
    layervault/deckbox-ventana/02
    layervault/deckbox-toploader/01
    layervault/caja-minisnap/01
    ...

  En products.json, el campo "images" almacena solo el public ID (sin URL base):
    "images": ["layervault/deckbox-ventana/01", "layervault/deckbox-ventana/02"]
*/
