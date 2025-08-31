import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect } from "react";

const DefaultIcon = L.icon({ iconUrl: marker1x, iconRetinaUrl: marker2x, shadowUrl: shadow, iconSize: [25,41], iconAnchor: [12,41] });
L.Marker.prototype.options.icon = DefaultIcon;

export type MapMarker = { id: string; position: [number, number]; title?: string; description?: string };

function ClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }){
  useMapEvents({
    click(e){ onClick?.(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

export function LeafletMap({ center = [28.6139, 77.209], zoom = 11, markers = [], onMapClick }: { center?: [number, number]; zoom?: number; markers?: MapMarker[]; onMapClick?: (lat: number, lng: number) => void }){
  useEffect(() => {
    // Leaflet CSS already imported above; ensure container sizes via parent
  }, []);
  return (
    <MapContainer center={center} zoom={zoom} className="h-80 w-full rounded-md overflow-hidden border">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {markers.map(m => (
        <Marker key={m.id} position={m.position}>
          <Popup>
            <div className="space-y-1">
              {m.title && <div className="font-medium">{m.title}</div>}
              {m.description && <div className="text-sm text-muted-foreground">{m.description}</div>}
            </div>
          </Popup>
        </Marker>
      ))}
      <ClickHandler onClick={onMapClick} />
    </MapContainer>
  );
}
