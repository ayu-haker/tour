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
    if (req.method !== "PATCH") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { Allow: "PATCH", "Content-Type": "application/json" },
      });
    }
    const urlIn = new URL(req.url);
    const id = urlIn.pathname.split("/").pop();
    const body = await req.json().catch(() => ({}));
    if (!id || !body.status)
      return new Response(
        JSON.stringify({ error: "id and status are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );

    const url = new URL(tableUrl("requests"));
    url.searchParams.set("id", `eq.${id}`);
    const r = await fetch(url.toString(), {
      method: "PATCH",
      headers: supabaseHeaders(),
      body: JSON.stringify({ status: String(body.status) }),
    });
    const txt = await r.text();
    return new Response(txt, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
