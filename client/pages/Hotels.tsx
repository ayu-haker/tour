import { useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { BookingForm } from "@/components/booking/BookingForm";
import { LeafletMap, MapMarker } from "@/components/maps/LeafletMap";

export default function Hotels(){
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  function onSubmit(form: Record<string, string>){
    const mock: MapMarker[] = [
      { id: "h1", position: [28.6139,77.209], title: `${form.from} Grand Hotel` },
      { id: "h2", position: [28.5355,77.3910], title: `${form.from} Boutique` },
    ];
    setMarkers(mock);
  }

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <BookingForm title="Hotel Booking" onSubmit={onSubmit} />
        <div>
          <LeafletMap markers={markers} />
        </div>
      </div>
    </SiteLayout>
  );
}
