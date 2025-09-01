import { Router } from "express";

const router = Router();

function env(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

function supabaseHeaders() {
  return {
    apikey: env("SUPABASE_ANON_KEY"),
    Authorization: `Bearer ${env("SUPABASE_ANON_KEY")}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  } as Record<string, string>;
}

function tableUrl(table: string) {
  const base = env("SUPABASE_URL");
  return `${base}/rest/v1/${table}`;
}

// GET /api/requests?type=cab|food|hotel
router.get("/", async (req, res) => {
  try {
    const type = (req.query.type as string) || undefined;
    const owner = (req.query.owner as string) || undefined;
    const url = new URL(tableUrl("requests"));
    if (type) url.searchParams.set("type", `eq.${type}`);
    if (owner) url.searchParams.set("owner_id", `eq.${owner}`);
    url.searchParams.set("order", "created_at.desc");
    const r = await fetch(url.toString(), { headers: supabaseHeaders() });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "failed" });
  }
});

// POST /api/requests { type, payload }
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.type || !body.payload)
      return res.status(400).json({ error: "type and payload are required" });
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
    const data = await r.json();
    res.status(r.status).json(data?.[0] ?? data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "failed" });
  }
});

// PATCH /api/requests/:id { status }
router.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body || {};
    if (!id || !status)
      return res.status(400).json({ error: "id and status are required" });
    const url = new URL(tableUrl("requests"));
    url.searchParams.set("id", `eq.${id}`);
    const r = await fetch(url.toString(), {
      method: "PATCH",
      headers: supabaseHeaders(),
      body: JSON.stringify({ status: String(status) }),
    });
    const data = await r.json();
    res.status(r.status).json(data?.[0] ?? data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "failed" });
  }
});

export default router;
