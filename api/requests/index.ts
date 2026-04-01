export const config = { runtime: "edge" };

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function supabaseHeaders() {
  const key = env("SUPABASE_ANON_KEY");
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  } as Record<string, string>;
}

function tableUrl(table: string) {
  const base = env("SUPABASE_URL");
  return `${base}/rest/v1/${table}`;
}

export default async function handler(req: Request) {
  try {
    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get("type") || undefined;
      const owner = searchParams.get("owner") || undefined;
      const url = new URL(tableUrl("requests"));
      if (type) url.searchParams.set("type", `eq.${type}`);
      if (owner) url.searchParams.set("owner_id", `eq.${owner}`);
      url.searchParams.set("order", "created_at.desc");
      const r = await fetch(url.toString(), { headers: supabaseHeaders() });
      const body = await r.text();
      return new Response(body, {
        status: r.status,
        headers: {
          "Content-Type": r.headers.get("Content-Type") || "application/json",
        },
      });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (!body.type || !body.payload)
        return new Response(
          JSON.stringify({ error: "type and payload are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      const r = await fetch(tableUrl("requests"), {
        method: "POST",
        headers: supabaseHeaders(),
        body: JSON.stringify([
          {
            type: String(body.type),
            status: body.status || "new",
            payload: body.payload,
            owner_id: body.owner_id ?? null,
          },
        ]),
      });
      const txt = await r.text();
      return new Response(txt, {
        status: r.status,
        headers: {
          "Content-Type": r.headers.get("Content-Type") || "application/json",
        },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { Allow: "GET, POST", "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
