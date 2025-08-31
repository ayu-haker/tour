import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap, LayersControl, ScaleControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const DefaultIcon = L.icon({ iconUrl: marker1x, iconRetinaUrl: marker2x, shadowUrl: shadow, iconSize: [25,41], iconAnchor: [12,41] });
L.Marker.prototype.options.icon = DefaultIcon;

export type MapMarker = { id: string; position: [number, number]; title?: string; description?: string };

function ClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }){
  useMapEvents({
    click(e){ onClick?.(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

type PathSpec = { points: [number, number][]; color?: string; weight?: number; opacity?: number };

function FitBounds({ markers, paths }: { markers: MapMarker[]; paths?: PathSpec[] | [number, number][] }){
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = [];
    markers.forEach(m => pts.push(m.position));
    if (Array.isArray(paths)) {
      if (paths.length && Array.isArray(paths[0])) pts.push(...(paths as [number,number][]));
      else (paths as PathSpec[]).forEach(p => pts.push(...p.points));
    }
    if (pts.length > 1) {
      const bounds = L.latLngBounds(pts.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds.pad(0.2));
    }
  }, [markers, paths, map]);
  return null;
}

export function LeafletMap({ center = [28.6139, 77.209], zoom = 11, markers = [], onMapClick, path, paths, className }: { center?: [number, number]; zoom?: number; markers?: MapMarker[]; onMapClick?: (lat: number, lng: number) => void; path?: [number, number][]; paths?: PathSpec[]; className?: string }){
  useEffect(() => {
    // Leaflet CSS already imported above; ensure container sizes via parent
  }, []);
  return (
    <MapContainer center={center} zoom={zoom} className={cn(className ?? "h-80 w-full", "rounded-md overflow-hidden border") as string}>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="OpenStreetMap HOT">
          <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors, HOT" />
        </LayersControl.BaseLayer>
      </LayersControl>
      <ScaleControl position="bottomleft" />
      <FitBounds markers={markers} paths={(paths ?? path) as any} />
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
      {paths && paths.map((p, i) => (
        p.points.length > 1 ? (
          <Polyline key={i} positions={p.points as any} pathOptions={{ color: p.color || "#22c55e", weight: p.weight || 4, opacity: p.opacity ?? 0.8 }} />
        ) : null
      ))}
      {!paths && path && path.length > 1 && (
        <Polyline positions={path as any} pathOptions={{ color: "#22c55e", weight: 4, opacity: 0.8 }} />
      )}
      <ClickHandler onClick={onMapClick} />
    </MapContainer>
  );
}
