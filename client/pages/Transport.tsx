import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { LeafletMap, MapMarker } from "@/components/maps/LeafletMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { STATE_CITIES } from "@/data/india";
import { Button } from "@/components/ui/button";
import { fetchTransitStops } from "@/lib/overpass";

export default function Transport(){
  const [stateName, setStateName] = useState<string>("Andhra Pradesh");
  const [city, setCity] = useState<string>(STATE_CITIES["Andhra Pradesh"][0].name);
  const [filters, setFilters] = useState({ bus: true, metro: true, train: true });
  const [loading, setLoading] = useState(false);
  const [stops, setStops] = useState<any[]>([]);

  const center = useMemo(() => {
    const all = Object.values(STATE_CITIES).flat();
    return (all.find((c)=>c.name===city)?.center || [20.5937, 78.9629]) as [number, number];
  }, [city]);

  async function load(){
    setLoading(true);
    try {
      const data = await fetchTransitStops(center, 8, filters);
      setStops(data);
    } finally { setLoading(false); }
  }

  useMemo(() => { load(); /* reload when city or filters change */ }, [city, filters.bus, filters.metro, filters.train]);

  const markers: MapMarker[] = stops.map((s) => ({
    id: s.id + "",
    position: [s.lat, s.lon],
    title: s.tags?.name || (s.tags?.railway || s.tags?.highway || "Stop"),
    description: [s.tags?.railway, s.tags?.highway, s.tags?.public_transport].filter(Boolean).join(" • "),
  }));

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Public Transport (Live OSM)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>State</Label>
              <Select value={stateName} onValueChange={(v)=>{ setStateName(v); setCity(STATE_CITIES[v][0].name); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(STATE_CITIES).map((s)=> (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>City</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATE_CITIES[stateName].map((c)=> (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex flex-wrap gap-2">
              <Button variant={filters.bus ? "default" : "outline"} onClick={()=>setFilters(f=>({...f, bus: !f.bus}))}>Bus</Button>
              <Button variant={filters.metro ? "default" : "outline"} onClick={()=>setFilters(f=>({...f, metro: !f.metro}))}>Metro</Button>
              <Button variant={filters.train ? "default" : "outline"} onClick={()=>setFilters(f=>({...f, train: !f.train}))}>Train</Button>
              <Button variant="secondary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</Button>
            </div>
            <div className="col-span-2 text-sm text-muted-foreground">Data fetched live from OpenStreetMap (Overpass). Toggle modes to filter stops.</div>
          </CardContent>
        </Card>

        <LeafletMap center={center} markers={markers} className="h-[70vh] w-full" />
      </div>
    </SiteLayout>
  );
}
