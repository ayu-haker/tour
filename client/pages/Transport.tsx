import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { LeafletMap, MapMarker } from "@/components/maps/LeafletMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { STATE_CITIES } from "@/data/india";
import { Button } from "@/components/ui/button";

// Generate simple sample networks for any city center
function makeNetwork(center: [number, number]) {
  const [lat, lng] = center;
  const stations = [
    { name: "Central", pos: [lat, lng] as [number, number] },
    { name: "North", pos: [lat + 0.06, lng + 0.02] as [number, number] },
    { name: "East", pos: [lat + 0.02, lng + 0.08] as [number, number] },
    { name: "South", pos: [lat - 0.05, lng - 0.01] as [number, number] },
    { name: "West", pos: [lat - 0.01, lng - 0.07] as [number, number] },
  ];
  return stations;
}

function haversine(a: [number, number], b: [number, number]) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const s = Math.sin(dLat/2)**2 + Math.sin(dLon/2)**2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(s));
}

const MODES = [
  { key: "Metro", color: "#2563eb", base: 10, perKm: 3 },
  { key: "Bus", color: "#f59e0b", base: 7, perKm: 2 },
  { key: "Train", color: "#22c55e", base: 20, perKm: 1.5 },
] as const;

type ModeKey = (typeof MODES)[number]["key"];

export default function Transport(){
  const [stateName, setStateName] = useState<string>("Andhra Pradesh");
  const [city, setCity] = useState<string>(STATE_CITIES["Andhra Pradesh"][0].name);
  const [active, setActive] = useState<ModeKey[]>(MODES.map(m=>m.key));

  const center = useMemo(() => {
    const all = Object.values(STATE_CITIES).flat();
    return (all.find((c)=>c.name===city)?.center || [20.5937, 78.9629]) as [number, number];
  }, [city]);

  const networks = useMemo(() => {
    const base = makeNetwork(center);
    return MODES.reduce((acc, m, i) => {
      // shift slightly per mode to avoid exact overlap
      const shift = 0.01 * i;
      const stations = base.map(s => ({ name: s.name, pos: [s.pos[0] + shift, s.pos[1] - shift] as [number, number] }));
      const points = stations.map(s => s.pos);
      const dist = points.slice(1).reduce((d, p, idx) => d + haversine(points[idx], p), 0);
      const fare = Math.round((m.base + m.perKm * dist) * 1.05);
      acc[m.key] = { stations, points, fare, color: m.color } as any;
      return acc;
    }, {} as Record<ModeKey, { stations: {name:string,pos:[number,number]}[]; points: [number,number][]; fare: number; color: string }>);
  }, [center]);

  const markers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];
    for (const m of MODES) {
      if (!active.includes(m.key)) continue;
      for (const [i, s] of networks[m.key].stations.entries()) {
        list.push({ id: `${m.key}-${i}`, position: s.pos, title: `${m.key}: ${s.name}`, description: `from ₹${networks[m.key].fare}` });
      }
    }
    return list;
  }, [networks, active]);

  const paths = useMemo(() => active.map(k => ({ points: networks[k].points, color: networks[k].color })), [networks, active]);

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Public Transport (All States)</CardTitle></CardHeader>
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
              {MODES.map((m)=> (
                <Button key={m.key} variant={active.includes(m.key) ? "default" : "outline"} style={{ backgroundColor: active.includes(m.key) ? m.color : undefined }} onClick={()=> setActive(a => a.includes(m.key) ? a.filter(x=>x!==m.key) : [...a, m.key])}>
                  {m.key} • from ₹{networks[m.key].fare}
                </Button>
              ))}
            </div>
            <div className="col-span-2 text-sm text-muted-foreground">All selected modes are overlaid together with sample fares.</div>
          </CardContent>
        </Card>

        <LeafletMap center={center} markers={markers} paths={paths as any} />
      </div>
    </SiteLayout>
  );
}
