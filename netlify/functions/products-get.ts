import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { requestOk } from "./_guard";
import seedCatalog from "../../src/assets/data/products.json";

const STORE_NAME = "products";
const BLOB_KEY    = "catalog";

const handler: Handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  };

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "method_not_allowed" }) };
  }
  if (!requestOk(event.headers)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "forbidden" }) };
  }

  try {
    const store    = getStore(STORE_NAME);
    const existing = await store.get(BLOB_KEY, { type: "json" });

    if (existing) {
      return { statusCode: 200, headers, body: JSON.stringify(existing) };
    }

    // Primer arranque: no hay blob todavía — sembramos con el JSON local
    await store.setJSON(BLOB_KEY, seedCatalog);
    return { statusCode: 200, headers, body: JSON.stringify(seedCatalog) };
  } catch (err) {
    console.error("Error reading products blob:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server_error" }) };
  }
};

export { handler };
