import type { Handler } from "@netlify/functions";
import { requestOk } from "./_guard";
import { verifyAdminSession } from "./_admin-auth";

const handler: Handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "method_not_allowed" }) };
  }
  if (!requestOk(event.headers)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "forbidden" }) };
  }

  const valid = verifyAdminSession(event.headers["cookie"]);
  return { statusCode: valid ? 200 : 401, headers, body: JSON.stringify({ valid }) };
};

export { handler };
