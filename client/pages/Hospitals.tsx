import { SiteLayout } from "@/components/layout/SiteLayout";
import { LeafletMap, MapMarker } from "@/components/maps/LeafletMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HOSPITALS: MapMarker[] = [
  { id:"h1", position:[28.63,77.21], title:"City Hospital" },
  { id:"h2", position:[28.60,77.24], title:"General Clinic" },
];

export default function Hospitals(){
  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Nearby Hospitals</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {HOSPITALS.map(h=> (
                <li key={h.id} className="rounded-md border p-3">{h.title}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <LeafletMap markers={HOSPITALS} />
      </div>
    </SiteLayout>
  );
}
