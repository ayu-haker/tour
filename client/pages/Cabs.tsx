import { useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { BookingForm } from "@/components/booking/BookingForm";
import { LeafletMap, MapMarker } from "@/components/maps/LeafletMap";

export default function Cabs(){
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  function onSubmit(form: Record<string, string>){
    const mock: MapMarker[] = [
      { id: "p", position: [28.61,77.20], title: `Pickup: ${form.from}` },
      { id: "d", position: [28.55,77.28], title: `Drop: ${form.to}` },
    ];
    setMarkers(mock);
  }

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <BookingForm title="Cab Booking" onSubmit={onSubmit} />
        <div>
          <LeafletMap markers={markers} />
        </div>
      </div>
    </SiteLayout>
  );
}
