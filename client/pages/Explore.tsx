import { useEffect, useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import CameraCapture from "@/components/media/CameraCapture";
import { loadJSON, saveJSON } from "@/lib/storage";
import { Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import React from "react";
import type { MapMarker } from "@/components/maps/LeafletMap";
import { useIsMobile } from "@/hooks/use-mobile";
const LeafletMap = React.lazy(() =>
  import("@/components/maps/LeafletMap").then((m) => ({ default: m.LeafletMap })),
);
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type TouristPlace = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: string;
  state: string;
  price: string;
};

type PlaceReview = {
  id: string;
  placeId: string;
  dataUrl: string | null;
  title: string;
  notes: string;
  rating: number;
  createdAt: number;
};

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const REV_KEY = "tour.placeReviews.v1";

type CityOption = {
  name: string;
  lat: number;
  lon: number;
};

function haversine(a: [number, number], b: [number, number]) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(s));
}

async function computeDrivingRoute(
  a: [number, number],
  b: [number, number],
): Promise<[number, number][]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Routing failed");
  const json = await res.json();
  const coords: [number, number][] =
    json.routes?.[0]?.geometry?.coordinates?.map((c: [number, number]) => [
      c[1],
      c[0],
    ]) ?? [];
  if (coords.length > 1) return coords;
  return [a, b];
}

function Rating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i + 1;
        const active = value >= idx;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onChange(idx)}
            aria-label={`Rate ${idx}`}
            className="p-0.5"
            title={`${idx} star${idx > 1 ? "s" : ""}`}
          >
            <Star
              size={18}
              className={
                active
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }
            />
          </button>
        );
      })}
    </div>
  );
}

export default function Explore() {
  const isMobile = useIsMobile();
  const LIMIT = isMobile ? 50 : 100;
  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");

  const [reviews, setReviews] = useState<PlaceReview[]>(() =>
    loadJSON<PlaceReview[]>(REV_KEY, []),
  );
  const [addOpen, setAddOpen] = useState(false);
  const [viewPlace, setViewPlace] = useState<TouristPlace | null>(null);
  const [targetPlace, setTargetPlace] = useState<TouristPlace | null>(null);

  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [revTitle, setRevTitle] = useState("");
  const [revNotes, setRevNotes] = useState("");
  const [revRating, setRevRating] = useState(0);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const { user } = useAuth();

  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const [selectedForRoute, setSelectedForRoute] = useState<TouristPlace | null>(
    null,
  );
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const byPlace = useMemo(() => {
    const map: Record<string, PlaceReview[]> = {};
    for (const r of reviews) {
      (map[r.placeId] ||= []).push(r);
    }
    for (const k of Object.keys(map))
      map[k].sort((a, b) => b.createdAt - a.createdAt);
    return map;
  }, [reviews]);

  const distanceMap = useMemo(() => {
    const out: Record<string, number> = {};
    if (!userLoc) return out;
    for (const p of places.slice(0, LIMIT)) {
      out[p.id] = haversine(userLoc, [p.lat, p.lon]);
    }
    return out;
  }, [userLoc, places]);

  function persist(next: PlaceReview[]) {
    setReviews(next);
    saveJSON(REV_KEY, next);
  }

  function openAdd(place: TouristPlace) {
    if (!user) {
      setLoginPrompt(true);
      return;
    }
    setTargetPlace(place);
    setPendingPhoto(null);
    setRevTitle("");
    setRevNotes("");
    setRevRating(0);
    setAddOpen(true);
  }

  function saveReview() {
    if (!targetPlace) return;
    const r: PlaceReview = {
      id: crypto.randomUUID(),
      placeId: targetPlace.id,
      dataUrl: pendingPhoto ?? null,
      title: revTitle || targetPlace.name,
      notes: revNotes,
      rating: revRating,
      createdAt: Date.now(),
    };
    const next = [r, ...reviews];
    persist(next);
    setAddOpen(false);
  }

  function deleteReview(id: string) {
    const next = reviews.filter((r) => r.id !== id);
    persist(next);
  }

  async function fetchOverpass(query: string) {
    const mirrors = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.zbycz.uk/api/interpreter",
      "https://overpass.nchc.org.tw/api/interpreter",
    ];

    let lastErr: any = null;
    for (const url of mirrors) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Accept: "application/json",
          },
          body: new URLSearchParams({ data: query }),
        });
        if (!res.ok) {
          lastErr = new Error(`overpass-status-${res.status}`);
          continue;
        }
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          return json;
        } catch (e) {
          // Not JSON (often XML/HTML error page). Try next mirror.
          lastErr = e;
          continue;
        }
      } catch (e) {
        lastErr = e;
        continue;
      }
    }
    throw lastErr || new Error("overpass-failed");
  }

  const fetchTouristPlaces = async (STATE_NAME: string) => {
    setLoading(true);
    setPlaces([]);

    const query = `
    [out:json][timeout:50];
    area["name"="${STATE_NAME}"]["boundary"="administrative"]["admin_level"="4"]->.searchArea;
    (
      node["tourism"](area.searchArea);
      way["tourism"](area.searchArea);
      node["historic"](area.searchArea);
      way["historic"](area.searchArea);
    );
    out center tags;
    `;

    try {
      const json = await fetchOverpass(query);

      const mapped: TouristPlace[] = (json.elements || [])
        .map((el: any) => {
          const tourism = String(el.tags?.tourism || "").toLowerCase();
          const amenity = String(el.tags?.amenity || "").toLowerCase();
          const name = (el.tags?.name ?? "").trim();
          const lodging = new Set([
            "hotel",
            "guest_house",
            "guesthouse",
            "hostel",
            "motel",
            "resort",
            "apartment",
            "alpine_hut",
            "camp_site",
            "lodging",
            "villa",
            "homestay",
          ]);
          const isLodging =
            lodging.has(tourism) ||
            lodging.has(amenity) ||
            /\b(hotel|resort|guest\s*house|hostel|motel|lodg(e|ing)|inn|villa|homestay)\b/i.test(name);
          if (isLodging) return null;
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          const type = el.tags?.tourism || el.tags?.historic || "general";
          const price =
            el.tags?.tourism === "museum"
              ? "₹50 – ₹200"
              : el.tags?.tourism === "attraction"
                ? "₹20 – ₹500"
                : el.tags?.tourism === "zoo"
                  ? "₹100 – ₹300"
                  : el.tags?.tourism === "theme_park"
                    ? "₹500 – ₹1500"
                    : "Free / Nominal";
          return {
            id: el.type + "/" + el.id,
            name,
            lat,
            lon,
            type,
            state: STATE_NAME,
            price,
          } as TouristPlace;
        })
        .filter(
          (p: any) =>
            p &&
            p.name &&
            p.name.length > 0 &&
            Number.isFinite(p.lat) &&
            Number.isFinite(p.lon),
        );

      setPlaces(mapped);
    } catch (err) {
      console.error("Error fetching places:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCitiesForState = async (STATE_NAME: string) => {
    setCitiesLoading(true);
    setCities([]);
    try {
      const query = `
      [out:json][timeout:40];
      area["name"="${STATE_NAME}"]["boundary"="administrative"]["admin_level"="4"]->.state;
      (
        node["place"~"city|town|municipality"](area.state);
      );
      out center tags;
      `;
      const json = await fetchOverpass(query);
      const raw: CityOption[] = (json.elements || [])
        .map((el: any) => ({
          name: el.tags?.name,
          lat: el.lat ?? el.center?.lat,
          lon: el.lon ?? el.center?.lon,
        }))
        .filter(
          (c: CityOption) =>
            c.name && Number.isFinite(c.lat) && Number.isFinite(c.lon),
        );
      const seen = new Set<string>();
      const unique: CityOption[] = [];
      for (const c of raw) {
        const nm = String(c.name).trim();
        if (seen.has(nm)) continue;
        seen.add(nm);
        unique.push({ ...c, name: nm });
      }
      unique.sort((a, b) => a.name.localeCompare(b.name));
      setCities(unique);
    } catch (e) {
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  };

  const fetchTouristPlacesCity = async (
    STATE_NAME: string,
    CITY_NAME: string,
    cityCenter?: [number, number],
  ) => {
    setLoading(true);
    setPlaces([]);
    try {
      const boundaryQuery = `
      [out:json][timeout:50];
      area["name"="${STATE_NAME}"]["boundary"="administrative"]["admin_level"="4"]->.state;
      rel["name"="${CITY_NAME}"]["boundary"="administrative"](area.state)->.cityArea;
      (
        node["tourism"](area.cityArea);
        way["tourism"](area.cityArea);
        node["historic"](area.cityArea);
        way["historic"](area.cityArea);
      );
      out center tags;
      `;
      let json = await fetchOverpass(boundaryQuery);
      let elems: any[] = json.elements || [];

      if (!elems.length && cityCenter) {
        const [clat, clon] = cityCenter;
        const aroundQuery = `
        [out:json][timeout:50];
        (
          node["tourism"](around:20000,${clat},${clon});
          way["tourism"](around:20000,${clat},${clon});
          node["historic"](around:20000,${clat},${clon});
          way["historic"](around:20000,${clat},${clon});
        );
        out center tags;
        `;
        json = await fetchOverpass(aroundQuery);
        elems = json.elements || [];
      }

      const mapped: TouristPlace[] = (elems || [])
        .map((el: any) => {
          const tourism = String(el.tags?.tourism || "").toLowerCase();
          const amenity = String(el.tags?.amenity || "").toLowerCase();
          const name = (el.tags?.name ?? "").trim();
          const lodging = new Set([
            "hotel",
            "guest_house",
            "guesthouse",
            "hostel",
            "motel",
            "resort",
            "apartment",
            "alpine_hut",
            "camp_site",
            "lodging",
            "villa",
            "homestay",
          ]);
          const isLodging =
            lodging.has(tourism) ||
            lodging.has(amenity) ||
            /\b(hotel|resort|guest\s*house|hostel|motel|lodg(e|ing)|inn|villa|homestay)\b/i.test(name);
          if (isLodging) return null;
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          const type = el.tags?.tourism || el.tags?.historic || "general";
          const price =
            el.tags?.tourism === "museum"
              ? "₹50 – ₹200"
              : el.tags?.tourism === "attraction"
                ? "₹20 – ₹500"
                : el.tags?.tourism === "zoo"
                  ? "₹100 – ₹300"
                  : el.tags?.tourism === "theme_park"
                    ? "₹500 – ₹1500"
                    : "Free / Nominal";
          return {
            id: el.type + "/" + el.id,
            name,
            lat,
            lon,
            type,
            state: STATE_NAME,
            price,
          } as TouristPlace;
        })
        .filter(
          (p: any) =>
            p &&
            p.name &&
            p.name.length > 0 &&
            Number.isFinite(p.lat) &&
            Number.isFinite(p.lon),
        );
      setPlaces(mapped);
    } catch (e) {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  function getLocation() {
    setLocError(null);
    if (!("geolocation" in navigator)) {
      setLocError("Geolocation is not supported on this device.");
      return;
    }
    const isSecure =
      typeof window !== "undefined" ? window.isSecureContext : true;
    if (!isSecure) {
      setLocError("Location requires HTTPS. Open the site over https://");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(p);
        setLocLoading(false);
      },
      async (err) => {
        if (err.code === err.PERMISSION_DENIED)
          setLocError(
            "Permission denied. Enable location access in your browser settings.",
          );
        else if (err.code === err.POSITION_UNAVAILABLE)
          setLocError("Location unavailable. Try again or check GPS.");
        else if (err.code === err.TIMEOUT)
          setLocError("Timed out while getting location. Try again.");
        else setLocError("Unable to get your location.");
        // Fallback to approximate IP location
        try {
          const ipr = await fetch("https://ipapi.co/json/");
          const ipd = await ipr.json().catch(() => ({}) as any);
          const lat = Number(ipd.latitude);
          const lon = Number(ipd.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            const p: [number, number] = [lat, lon];
            setUserLoc(p);
            setLocError(
              "Using approximate location based on IP (may be inaccurate).",
            );
          }
        } catch {}
        setLocLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  }

  async function routeTo(place: TouristPlace) {
    if (!userLoc) {
      setLocError("Set your location first.");
      return;
    }
    setSelectedForRoute(place);
    setRouteLoading(true);
    setRouteError(null);
    try {
      const pts = await computeDrivingRoute(userLoc, [place.lat, place.lon]);
      setRoutePoints(pts);
    } catch (e) {
      setRouteError("Could not fetch driving route. Showing straight line.");
      setRoutePoints([userLoc, [place.lat, place.lon]]);
    } finally {
      setRouteLoading(false);
    }
  }

  const markers: MapMarker[] = useMemo(() => {
    const m: MapMarker[] = [];
    if (userLoc) m.push({ id: "me", position: userLoc, title: "You" });
    for (const p of places.slice(0, LIMIT))
      m.push({
        id: p.id,
        position: [p.lat, p.lon],
        title: p.name,
        description: `${p.type} • ${p.state}`,
      });
    if (selectedForRoute)
      m.push({
        id: "dest",
        position: [selectedForRoute.lat, selectedForRoute.lon],
        title: selectedForRoute.name,
      });
    return m;
  }, [userLoc, places, selectedForRoute]);

  return (
    <SiteLayout>
      <div className="p-4 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-2xl font-bold">
            Explore Tourist Places in India
          </h1>

          <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2">
            <select
              value={selectedState}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedState(v);
                setSelectedCity("");
                if (v) {
                  fetchTouristPlaces(v);
                  fetchCitiesForState(v);
                } else {
                  setPlaces([]);
                  setCities([]);
                }
              }}
              className="border rounded-lg p-2 w-full md:flex-1 bg-background"
            >
              <option value="">Select a State / UT</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedCity(v);
                if (v) {
                  const city = cities.find((c) => c.name === v);
                  fetchTouristPlacesCity(
                    selectedState,
                    v,
                    city ? [city.lat, city.lon] : undefined,
                  );
                } else if (selectedState) {
                  fetchTouristPlaces(selectedState);
                }
              }}
              disabled={!selectedState || citiesLoading}
              className="border rounded-lg p-2 w-full md:flex-1 md:max-w-sm bg-background disabled:opacity-60"
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option
                  key={`${c.name}-${c.lat.toFixed(3)}-${c.lon.toFixed(3)}`}
                  value={c.name}
                >
                  {c.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                onClick={getLocation}
                disabled={locLoading}
              >
                {locLoading
                  ? "Locating…"
                  : userLoc
                    ? "Update my location"
                    : "Use my location"}
              </Button>
              {userLoc && (
                <span className="text-sm text-muted-foreground">Set</span>
              )}
            </div>
          </div>
          {locError && <p className="text-xs text-red-600">{locError}</p>}
          {selectedState && citiesLoading && (
            <p className="text-xs text-muted-foreground">Loading cities…</p>
          )}

          {loading && (
            <>
              <p>Loading tourist places in {selectedState}...</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border p-4 rounded-xl bg-card">
                    <Skeleton className="h-5 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && selectedState && places.length === 0 && (
            <p>No places found for {selectedState}. Try another state.</p>
          )}

          {!loading && places.length > 0 && (
            <>
              <p>
                Showing first {places.slice(0, LIMIT).length} results for{" "}
                <b>{selectedState}</b>{" "}
                {selectedCity && (
                  <>
                    in <b>{selectedCity}</b>
                  </>
                )}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {places.slice(0, LIMIT).map((place) => {
                  const d = distanceMap[place.id];
                  return (
                    <div
                      key={place.id}
                      className="border p-4 rounded-xl shadow bg-card hover:shadow-lg transition"
                    >
                      <h2 className="font-bold text-lg">{place.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {place.state} • {place.type}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        Entry Fee: {place.price}
                      </p>
                      <p className="text-xs">
                        📍 Lat: {place.lat}, Lon: {place.lon}
                      </p>
                      {userLoc && (
                        <p className="text-xs mt-1">
                          Distance: {d?.toFixed(2)} km
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button size="sm" onClick={() => openAdd(place)}>
                          Add Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewPlace(place)}
                        >
                          Reviews ({byPlace[place.id]?.length || 0})
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => routeTo(place)}
                          disabled={!userLoc}
                        >
                          Show route
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="md:col-span-1">
          <div className="md:sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle>Map</CardTitle>
              </CardHeader>
              <CardContent>
                <React.Suspense
                  fallback={<div className="h-[50vh] md:h-[65vh] rounded-md border grid place-items-center text-sm text-muted-foreground">Loading map…</div>}
                >
                  <LeafletMap
                  center={
                    (userLoc ||
                      (selectedCity &&
                      cities.find((c) => c.name === selectedCity)
                        ? [
                            cities.find((c) => c.name === selectedCity)!.lat,
                            cities.find((c) => c.name === selectedCity)!.lon,
                          ]
                        : places[0] && [places[0].lat, places[0].lon]) || [
                        20.5937, 78.9629,
                      ]) as [number, number]
                  }
                  markers={markers}
                  paths={
                    routePoints.length > 1
                      ? [{ points: routePoints, color: "#3b82f6", weight: 5 }]
                      : undefined
                  }
                  path={
                    !routePoints.length && selectedForRoute && userLoc
                      ? [userLoc, [selectedForRoute.lat, selectedForRoute.lon]]
                      : undefined
                  }
                  className={isMobile ? "h-[50vh]" : "h-[65vh]"}
                />
                </React.Suspense>
                {routeLoading && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Calculating route…
                  </p>
                )}
                {routeError && (
                  <p className="text-xs text-amber-600 mt-2">{routeError}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-full sm:max-w-xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Add Review{targetPlace ? ` — ${targetPlace.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <CameraCapture onCapture={(d) => setPendingPhoto(d)} />
            {pendingPhoto && (
              <img
                src={pendingPhoto}
                alt="Preview"
                className="w-full max-h-60 object-contain rounded-md border"
                loading="lazy"
                decoding="async"
              />
            )}
            <div>
              <Label htmlFor="rt">Title</Label>
              <Input
                id="rt"
                value={revTitle}
                onChange={(e) => setRevTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rn">Notes</Label>
              <Textarea
                id="rn"
                rows={3}
                value={revNotes}
                onChange={(e) => setRevNotes(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 block">Rating</Label>
              <Rating value={revRating} onChange={setRevRating} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveReview}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewPlace} onOpenChange={(o) => !o && setViewPlace(null)}>
        <DialogContent className="max-w-full sm:max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Reviews{viewPlace ? ` — ${viewPlace.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {viewPlace && (byPlace[viewPlace.id]?.length || 0) === 0 && (
              <p className="text-sm text-muted-foreground">
                No reviews yet for this place.
              </p>
            )}
            {viewPlace && (byPlace[viewPlace.id]?.length || 0) > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {byPlace[viewPlace.id]!.map((r) => (
                  <div
                    key={r.id}
                    className="border rounded-md overflow-hidden bg-card"
                  >
                    {r.dataUrl ? (
                      <img
                        src={r.dataUrl}
                        alt={r.title}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-40 grid place-items-center text-sm text-muted-foreground border-b">
                        No photo
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate" title={r.title}>
                          {r.title}
                        </h3>
                        <Rating
                          value={r.rating}
                          onChange={(v) => {
                            const next = reviews.map((x) =>
                              x.id === r.id ? { ...x, rating: v } : x,
                            );
                            persist(next);
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(r.createdAt).toLocaleString()}
                      </p>
                      {r.notes && (
                        <p className="text-sm mt-2 whitespace-pre-wrap">
                          {r.notes}
                        </p>
                      )}
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteReview(r.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={loginPrompt} onOpenChange={setLoginPrompt}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Login required</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You must be logged in to add a review. Please login to continue.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLoginPrompt(false)}>
              Close
            </Button>
            <Button asChild>
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
