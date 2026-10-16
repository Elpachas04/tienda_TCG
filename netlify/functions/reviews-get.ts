import type { Handler } from "@netlify/functions";
import { requestOk } from "./_guard";
import { listReviews, reviewsStore, toPublic } from "./_reviews";

// Valoraciones publicadas, para la web. La web solo las enseña si "Mostrar valoraciones" está activado en el admin.
const handler: Handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=0, must-revalidate",
    "Netlify-CDN-Cache-Control": "public, durable, s-maxage=300, stale-while-revalidate=86400",
    "Netlify-Cache-Tag": "reviews",
  };
  if (event.httpMethod !== "GET") return { statusCode: 405, headers, body: JSON.stringify({ error: "method_not_allowed" }) };
  if (!requestOk(event.headers)) return { statusCode: 403, headers, body: JSON.stringify({ error: "forbidden" }) };
  try {
    const reviews = (await listReviews(reviewsStore(event))).filter(r => r.status === "publicada").map(toPublic);
    return { statusCode: 200, headers, body: JSON.stringify({ reviews }) };
  } catch (err) {
    console.error("reviews-get error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server_error" }) };
  }
};

export { handler };
