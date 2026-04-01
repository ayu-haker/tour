import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { LeafletMap, MapMarker } from "@/components/maps/LeafletMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATE_CITIES } from "@/data/india";

export type Hospital = { id: string; name: string; state: string; city: string; type: "Govt" | "Private"; position: [number, number] };

const STATE_HOSPITALS: Hospital[] = Object.entries(STATE_CITIES).flatMap(([state, cities]) =>
  cities.flatMap((c, idx) => [
    { id: `h-${state}-${idx}-1`, name: `${c.name} General Hospital`, state, city: c.name, type: "Govt", position: [c.center[0] + 0.015, c.center[1] + 0.012] as [number, number] },
    { id: `h-${state}-${idx}-2`, name: `${c.name} Multispeciality Care`, state, city: c.name, type: "Private", position: [c.center[0] - 0.01, c.center[1] - 0.01] as [number, number] },
  ])
);

export default function Hospitals(){
  const [stateName, setStateName] = useState<string>("Andhra Pradesh");
  const [city, setCity] = useState<string>("all");
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("any");

  const center = useMemo(() => {
    if (city === "all") return [20.5937, 78.9629] as [number, number];
    const list = Object.values(STATE_CITIES).flat();
    return list.find(c => c.name === city)?.center || [20.5937, 78.9629];
  }, [city]);

  const results = useMemo(() => {
    return STATE_HOSPITALS.filter(h =>
      h.state === stateName &&
      (city === "all" || h.city === city) &&
      (type === "any" || h.type === type) &&
      (!q || h.name.toLowerCase().includes(q.toLowerCase()))
    );
  }, [stateName, city, type, q]);

  const markers: MapMarker[] = results.map(h => ({ id: h.id, position: h.position, title: h.name, description: `${h.city} • ${h.type}` }));

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Hospitals (All States)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>State</Label>
              <Select value={stateName} onValueChange={(v)=>{ setStateName(v); setCity("all"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(STATE_CITIES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>City</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger><SelectValue placeholder="All Cities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {STATE_CITIES[stateName].map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="Govt">Government</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search</Label>
              <Input placeholder="Hospital name" value={q} onChange={(e)=>setQ(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <LeafletMap center={center} markers={markers} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map(h => (
          <Card key={h.id} className="hover:shadow-sm transition-shadow">
            <CardHeader><CardTitle className="text-lg">{h.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">{h.city}, {h.state} • {h.type}</div>
            </CardContent>
          </Card>
        ))}
        {results.length === 0 && <p className="text-sm text-muted-foreground">No hospitals found.</p>}
      </div>
    </SiteLayout>
  );
}
