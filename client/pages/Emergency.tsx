import { SiteLayout } from "@/components/layout/SiteLayout";
import { LeafletMap, MapMarker } from "@/components/maps/LeafletMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const contacts = [
  { label: "Police", phone: "100" },
  { label: "Ambulance", phone: "102" },
  { label: "Fire", phone: "101" },
];

export default function Emergency(){
  const markers: MapMarker[] = [];
  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Emergency Contacts</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {contacts.map(c => (
                <li key={c.label} className="flex items-center justify-between rounded-md border p-3">
                  <span>{c.label}</span>
                  <a className="text-primary" href={`tel:${c.phone}`}>{c.phone}</a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <LeafletMap markers={markers} />
      </div>
    </SiteLayout>
  );
}
