import { useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { LeafletMap, MapMarker } from "@/components/maps/LeafletMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Food(){
  const [q, setQ] = useState("");
  const [markers] = useState<MapMarker[]>([
    { id:"r1", position:[28.61,77.20], title:"Spice Hub" },
    { id:"r2", position:[28.59,77.22], title:"Curry Corner" },
  ]);

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Food Delivery</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Search restaurants or dishes" value={q} onChange={e=>setQ(e.target.value)} />
            <ul className="space-y-2 text-sm">
              {markers.filter(m=>m.title?.toLowerCase().includes(q.toLowerCase())).map(m=> (
                <li key={m.id} className="rounded-md border p-3">{m.title}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <LeafletMap markers={markers} />
      </div>
    </SiteLayout>
  );
}
