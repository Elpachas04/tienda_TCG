import type { Handler } from "@netlify/functions";
import { originOk } from "./_guard";
import { clearSessionCookie } from "./_admin-auth";

const handler: Handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "method_not_allowed" }) };
  }
  if (!originOk(event.headers)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "forbidden" }) };
  }

  return {
    statusCode: 200,
    headers,
    multiValueHeaders: { "Set-Cookie": [clearSessionCookie()] },
    body: JSON.stringify({ success: true }),
  };
};

export { handler };
