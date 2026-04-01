export type TransitStop = {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
};

export type TransitFilters = {
  bus?: boolean;
  metro?: boolean;
  train?: boolean;
};

function bboxFromCenter([lat, lon]: [number, number], radiusKm: number): [number, number, number, number] {
  const dLat = radiusKm / 110.574;
  const dLon = radiusKm / (111.320 * Math.cos((lat * Math.PI) / 180));
  return [lat - dLat, lon - dLon, lat + dLat, lon + dLon];
}

export async function fetchTransitStops(center: [number, number], radiusKm: number, filters: TransitFilters): Promise<TransitStop[]> {
  const [s, w, n, e] = bboxFromCenter(center, radiusKm);
  const sel: string[] = [];
  if (filters.bus !== false) sel.push(`node["highway"="bus_stop"](${s},${w},${n},${e});`);
  if (filters.metro !== false) sel.push(`node["railway"="subway_entrance"](${s},${w},${n},${e});`);
  if (filters.train !== false) sel.push(`node["railway"="station"](${s},${w},${n},${e});`);
  const query = `[out:json][timeout:25];(${sel.join("\n")});out body;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body: new URLSearchParams({ data: query }).toString(),
  });
  if (!res.ok) throw new Error(`Overpass error ${res.status}`);
  const json = await res.json();
  return (json.elements || []) as TransitStop[];
}
