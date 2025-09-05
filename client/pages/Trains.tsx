import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { BookingForm } from "@/components/booking/BookingForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { TransportOption } from "../../shared/transport";
import { loadJSON, saveJSON } from "@/lib/storage";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

async function fetchTrains(q: { from: string; to: string; date: string }) {
  const params = new URLSearchParams(q as any).toString();
  let r = await fetch(`/api/trains/search?${params}`);
  if (r.status === 404) r = await fetch(`/api/trains?${params}`);
  if (!r.ok) throw new Error("failed");
  return (await r.json()) as TransportOption[];
}

export default function Trains() {
  const { toast } = useToast();
  const [cls, setCls] = useState("sleeper");
  const [query, setQuery] = useState<{ from: string; to: string; date: string } | null>(null);

  const { data, isFetching, isError } = useQuery({
    queryKey: ["trains", query],
    queryFn: () => fetchTrains(query as any),
    enabled: !!query,
    refetchInterval: 5000,
  });

  async function book(opt: TransportOption) {
    toast({ title: "Booking created", description: `${opt.provider} ${opt.code} • ₹${opt.price.toLocaleString("en-IN")}` });
    try {
      const r = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "train",
          payload: { ...opt, class: cls },
        }),
      });
      const data = await r.json();
      const MY_REQ_KEY = "tour.myRequests";
      const list = loadJSON<string[]>(MY_REQ_KEY, []);
      if (data?.id && !list.includes(String(data.id))) {
        list.unshift(String(data.id));
        saveJSON(MY_REQ_KEY, list.slice(0, 100));
      }
    } catch {}
  }

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <BookingForm
            title="Train Search"
            onSubmit={(f) => setQuery({ from: f.from, to: f.to, date: f.date })}
          >
            <div className="sm:col-span-2">
              <Label>Class</Label>
              <Select value={cls} onValueChange={setCls}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sleeper">Sleeper</SelectItem>
                  <SelectItem value="3A">3A</SelectItem>
                  <SelectItem value="2A">2A</SelectItem>
                  <SelectItem value="1A">1A</SelectItem>
                  <SelectItem value="chair">Chair Car</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground sm:col-span-2">Live updates every 5s</div>
          </BookingForm>
        </div>
        <div className="lg:col-span-2 grid gap-3">
          {isError && <div className="text-red-600">Failed to load trains</div>}
          {!query && <div className="text-muted-foreground">Enter search details to see trains.</div>}
          {query && (
            <div className="text-sm text-muted-foreground">{query.from} → {query.to} on {new Date(query.date).toDateString()}</div>
          )}
          {(data || []).map((opt) => (
            <Card key={opt.id} className="overflow-hidden">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{opt.provider} <span className="text-muted-foreground">{opt.code}</span></div>
                  <div className="flex items-center gap-2">
                    <Badge variant={opt.seatsAvailable > 0 ? "default" : "secondary"}>{opt.seatsAvailable} seats</Badge>
                    <Badge variant="outline">₹{opt.price.toLocaleString("en-IN")}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-3">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-lg font-semibold">{formatTime(opt.departTime)} → {formatTime(opt.arriveTime)}</div>
                    <div className="text-muted-foreground">{formatDuration(opt.durationMinutes)}</div>
                  </div>
                  <Button onClick={() => book(opt)} disabled={opt.seatsAvailable === 0 || isFetching}>Book</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {query && !data?.length && !isFetching && (
            <div className="text-muted-foreground">No trains found.</div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
