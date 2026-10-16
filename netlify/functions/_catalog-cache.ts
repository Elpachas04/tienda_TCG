import { purgeCache, type HandlerContext } from "@netlify/functions";

const CATALOG_TAG = "catalog";

// El navegador siempre pregunta (max-age=0), pero la CDN de Netlify responde al momento con su copia:
// fresca 5 min y, pasado ese tiempo, la sirve igual mientras la renueva por detrás. Así ningún cliente
// espera a que arranque la función. "durable" comparte la copia entre todos los nodos de la CDN.
export const CATALOG_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=0, must-revalidate",
  "Netlify-CDN-Cache-Control": "public, durable, s-maxage=300, stale-while-revalidate=31536000",
  "Netlify-Cache-Tag": CATALOG_TAG,
};

/** Tras guardar en el admin: la siguiente visita ya ve el catálogo nuevo. Si falla, se renueva solo en ≤ 5 min. */
export async function purgeCatalogCache(context: HandlerContext): Promise<void> {
  try {
    // Las funciones en formato Lambda no tienen el token de purga en el entorno: Netlify lo pasa en el contexto
    const token = (context.clientContext?.["custom"] as { purge_api_token?: string } | undefined)?.purge_api_token;
    await purgeCache({ tags: [CATALOG_TAG], token });
  } catch (err) {
    console.error("No se pudo purgar la caché del catálogo:", err);
  }
}
