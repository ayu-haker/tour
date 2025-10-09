import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { BookingForm } from "@/components/booking/BookingForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

async function fetchFlights(q: { from: string; to: string; date: string }) {
  const params = new URLSearchParams(q as any).toString();
  // Try Vercel Edge first, then Express fallback
  let r = await fetch(`/api/flights?${params}`);
  let okJson = r.ok && (r.headers.get("content-type") || "").includes("application/json");
  if (!okJson) r = await fetch(`/api/flights/search?${params}`);
  if (!r.ok) throw new Error("failed");
  const txt = await r.text();
  try { return JSON.parse(txt) as TransportOption[]; } catch { throw new Error("bad-json"); }
}

async function fetchRecommendations(q: { from: string; to: string; date: string }) {
  const params = new URLSearchParams(q as any).toString();
  let r = await fetch(`/api/flights/recommend?${params}`);
  if (!r.ok) r = await fetch(`/api/flights/recommend?${params}`);
  if (!r.ok) r = await fetch(`/.netlify/functions/api/flights/recommend?${params}`);
  if (!r.ok) return [];
  const txt = await r.text();
  try { return JSON.parse(txt) as any[]; } catch { return []; }
}

export default function Flights() {
  const { toast } = useToast();
  const [cls, setCls] = useState("economy");
  const [query, setQuery] = useState<{
    from: string;
    to: string;
    date: string;
  } | null>(null);

  const [live, setLive] = useState(true);
  const { data, isFetching, isError } = useQuery({
    queryKey: ["flights", query, live],
    queryFn: () => fetchFlights(query as any),
    enabled: !!query,
    refetchInterval: live ? 3000 : false,
  });

  const { data: recs } = useQuery({
    queryKey: ["flights-recommend", query],
    queryFn: () => fetchRecommendations(query as any),
    enabled: !!query,
    refetchInterval: 15000,
  });

  function airlineUrl(provider: string) {
    const p = provider.toLowerCase();
    if (p.includes("indigo")) return "https://www.goindigo.in/";
    if (p.includes("air india")) return "https://www.airindia.com/";
    if (p.includes("vistara")) return "https://www.airvistara.com/";
    if (p.includes("spice")) return "https://www.spicejet.com/";
    if (p.includes("akasa")) return "https://www.akasaair.com/";
    return "https://www.google.com/travel/flights";
  }

  async function book(opt: TransportOption) {
    toast({
      title: "Booking created",
      description: `${opt.provider} ${opt.code} • ₹${opt.price.toLocaleString("en-IN")}`,
    });
    try {
      const r = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "flight",
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
            title="Flight Search"
            onSubmit={(f) => setQuery({ from: f.from, to: f.to, date: f.date })}
          >
            <div className="sm:col-span-2">
              <Label>Class</Label>
              <Select value={cls} onValueChange={setCls}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium">Premium Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Live updates every 3s
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="live">Live</Label>
                <Switch id="live" checked={live} onCheckedChange={setLive} />
              </div>
            </div>
          </BookingForm>
        </div>
        <div className="lg:col-span-2 grid gap-3">
          {isError && (
            <div className="text-red-600">Failed to load flights</div>
          )}
          {!query && (
            <div className="text-muted-foreground">
              Enter search details to see flights.
            </div>
          )}
          {query && (
            <div className="text-sm text-muted-foreground">
              {query.from} → {query.to} on {new Date(query.date).toDateString()}
            </div>
          )}
          {(data || []).map((opt) => (
            <Card key={opt.id} className="overflow-hidden">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {opt.provider}{" "}
                    <span className="text-muted-foreground">{opt.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={opt.seatsAvailable > 0 ? "default" : "secondary"}
                    >
                      {opt.seatsAvailable} seats
                    </Badge>
                    <Badge variant="outline">
                      ₹{opt.price.toLocaleString("en-IN")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div>
                    <div className="text-lg font-semibold">
                      {formatTime(opt.departTime)} →{" "}
                      {formatTime(opt.arriveTime)}
                    </div>
                    <div className="text-muted-foreground">
                      {formatDuration(opt.durationMinutes)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => book(opt)}
                      disabled={opt.seatsAvailable === 0 || isFetching}
                    >
                      Book
                    </Button>
                    <Button variant="secondary" asChild>
                      <a
                        href={airlineUrl(opt.provider)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Airline site
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {query && !data?.length && !isFetching && (
            <div className="text-muted-foreground">No flights found.</div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
