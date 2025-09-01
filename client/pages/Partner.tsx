import { useEffect, useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Req = {
  id: string;
  type: "cab" | "food" | "hotel";
  status: string;
  created_at: string;
  owner_id?: string | null;
  payload: any;
};

async function fetchRequests(type?: string, owner?: string): Promise<Req[]> {
  const q = new URLSearchParams();
  if (type) q.set('type', type);
  if (owner) q.set('owner', owner);
  const r = await fetch(`/api/requests${q.toString() ? `?${q.toString()}` : ''}`);
  if (!r.ok) throw new Error("failed");
  return await r.json();
}

async function updateStatus(id: string, status: string) {
  const r = await fetch(`/api/requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!r.ok) throw new Error("update failed");
}

export default function Partner() {
  const [tab, setTab] = useState<"cab" | "food" | "hotel">("cab");
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [biz, setBiz] = useState<string>(() => localStorage.getItem('partner.businessId') || '');

  async function load() {
    try {
      setErr(null);
      setLoading(true);
      const data = await fetchRequests(tab, biz || undefined);
      setItems(data);
    } catch (e: any) {
      setErr(e?.message || "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [tab, biz]);

  return (
    <SiteLayout>
      <Card>
        <CardHeader>
          <CardTitle>Partner Dashboard</CardTitle>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <label className="text-muted-foreground">Business ID</label>
            <input value={biz} onChange={(e)=>{ setBiz(e.target.value); localStorage.setItem('partner.businessId', e.target.value); }} className="px-2 py-1 rounded border bg-background" placeholder="e.g. restaurant id or hotel id" />
            <span className="text-xs text-muted-foreground">Shows only requests with owner_id = Business ID.</span>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="cab">Cabs</TabsTrigger>
              <TabsTrigger value="food">Food</TabsTrigger>
              <TabsTrigger value="hotel">Hotels</TabsTrigger>
            </TabsList>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Auto-refresh every 5s
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={load}
                disabled={loading}
              >
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
            {(["cab", "food", "hotel"] as const).map((t) => (
              <TabsContent key={t} value={t} className="mt-4">
                <RequestList
                  items={items}
                  onStatus={async (id, st) => {
                    await updateStatus(id, st);
                    await load();
                  }}
                />
              </TabsContent>
            ))}
          </Tabs>
          {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
        </CardContent>
      </Card>
    </SiteLayout>
  );
}

function RequestList({
  items,
  onStatus,
}: {
  items: Req[];
  onStatus: (id: string, st: string) => void;
}) {
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">No requests yet.</p>;
  return (
    <div className="grid gap-3">
      {items.map((r) => (
        <div key={r.id} className="rounded-md border p-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">
              {r.type.toUpperCase()} •{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {new Date(r.created_at).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs rounded-full border px-2 py-0.5">
                {r.status}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatus(r.id, "accepted")}
              >
                Accept
              </Button>
              <Button size="sm" onClick={() => onStatus(r.id, "completed")}>
                Complete
              </Button>
            </div>
          </div>
          <pre className="mt-2 text-xs whitespace-pre-wrap break-words bg-muted/30 p-2 rounded">
            {JSON.stringify(r.payload, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}
