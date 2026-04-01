export const config = { runtime: "edge" };

import { generateOptions, validateParams } from "../../shared/transport";

export default async function handler(req: Request) {
  try {
    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", Allow: "GET" },
      });
    }
    const { searchParams } = new URL(req.url);
    const params = validateParams(searchParams);
    const options = generateOptions("flight", params);
    return new Response(JSON.stringify(options), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "failed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
