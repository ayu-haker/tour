import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import CameraCapture from "@/components/media/CameraCapture";
import { loadJSON, saveJSON } from "@/lib/storage";
import { Star } from "lucide-react";

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
  rating: number; // 0-5
  createdAt: number;
};

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const REV_KEY = "tour.placeReviews.v1";

function Rating({ value, onChange }: { value: number; onChange: (v: number) => void }){
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
            <Star size={18} className={active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"} />
          </button>
        );
      })}
    </div>
  );
}

export default function Explore() {
  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState("");

  const [reviews, setReviews] = useState<PlaceReview[]>(() => loadJSON<PlaceReview[]>(REV_KEY, []));
  const [addOpen, setAddOpen] = useState(false);
  const [viewPlace, setViewPlace] = useState<TouristPlace | null>(null);
  const [targetPlace, setTargetPlace] = useState<TouristPlace | null>(null);

  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [revTitle, setRevTitle] = useState("");
  const [revNotes, setRevNotes] = useState("");
  const [revRating, setRevRating] = useState(0);

  const byPlace = useMemo(() => {
    const map: Record<string, PlaceReview[]> = {};
    for (const r of reviews) {
      (map[r.placeId] ||= []).push(r);
    }
    for (const k of Object.keys(map)) map[k].sort((a,b)=>b.createdAt - a.createdAt);
    return map;
  }, [reviews]);

  function persist(next: PlaceReview[]) {
    setReviews(next);
    saveJSON(REV_KEY, next);
  }

  function openAdd(place: TouristPlace) {
    setTargetPlace(place);
    setPendingPhoto(null);
    setRevTitle("");
    setRevNotes("");
    setRevRating(0);
    setAddOpen(true);
  }

  function saveReview(){
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

  function deleteReview(id: string){
    const next = reviews.filter(r => r.id !== id);
    persist(next);
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
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });
      const json = await response.json();

      const mapped: TouristPlace[] = json.elements.map((el: any) => ({
        id: el.type + "/" + el.id,
        name: el.tags?.name || "Unknown",
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        type: el.tags?.tourism || el.tags?.historic || "general",
        state: STATE_NAME,
        price:
          el.tags?.tourism === "museum"
            ? "₹50 – ₹200"
            : el.tags?.tourism === "attraction"
            ? "₹20 – ₹500"
            : el.tags?.tourism === "zoo"
            ? "₹100 – ₹300"
            : el.tags?.tourism === "theme_park"
            ? "₹500 – ₹1500"
            : el.tags?.tourism === "hotel"
            ? "Varies"
            : "Free / Nominal",
      }));

      setPlaces(mapped);
    } catch (err) {
      console.error("Error fetching places:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Explore Tourist Places in India</h1>

        <div className="flex gap-2 mb-4">
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              if (e.target.value) fetchTouristPlaces(e.target.value);
            }}
            className="border rounded-lg p-2 flex-1 bg-background"
          >
            <option value="">Select a State / UT</option>
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        {loading && <p>Loading tourist places in {selectedState}...</p>}

        {!loading && selectedState && places.length === 0 && (
          <p>No places found for {selectedState}. Try another state.</p>
        )}

        {!loading && places.length > 0 && (
          <>
            <p className="mb-2">
              Showing first {places.slice(0, 100).length} results for <b>{selectedState}</b>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {places.slice(0, 100).map((place) => (
                <div
                  key={place.id}
                  className="border p-4 rounded-xl shadow bg-card hover:shadow-lg transition"
                >
                  <h2 className="font-bold text-lg">{place.name}</h2>
                  <p className="text-sm text-muted-foreground">{place.state} • {place.type}</p>
                  <p className="text-sm font-medium mt-1">Entry Fee: {place.price}</p>
                  <p className="text-xs">📍 Lat: {place.lat}, Lon: {place.lon}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" onClick={()=>openAdd(place)}>Add Review</Button>
                    <Button size="sm" variant="outline" onClick={()=>setViewPlace(place)}>Reviews ({byPlace[place.id]?.length || 0})</Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Review Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Review{targetPlace ? ` — ${targetPlace.name}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <CameraCapture onCapture={(d)=>setPendingPhoto(d)} />
            {pendingPhoto && (
              <img src={pendingPhoto} alt="Preview" className="w-full max-h-60 object-contain rounded-md border" />
            )}
            <div>
              <Label htmlFor="rt">Title</Label>
              <Input id="rt" value={revTitle} onChange={(e)=>setRevTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="rn">Notes</Label>
              <Textarea id="rn" rows={3} value={revNotes} onChange={(e)=>setRevNotes(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Rating</Label>
              <Rating value={revRating} onChange={setRevRating} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setAddOpen(false)}>Cancel</Button>
              <Button onClick={saveReview}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Reviews Dialog */}
      <Dialog open={!!viewPlace} onOpenChange={(o)=>!o && setViewPlace(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reviews{viewPlace ? ` — ${viewPlace.name}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {viewPlace && (byPlace[viewPlace.id]?.length || 0) === 0 && (
              <p className="text-sm text-muted-foreground">No reviews yet for this place.</p>
            )}
            {viewPlace && (byPlace[viewPlace.id]?.length || 0) > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {byPlace[viewPlace.id]!.map(r => (
                  <div key={r.id} className="border rounded-md overflow-hidden bg-card">
                    {r.dataUrl ? (
                      <img src={r.dataUrl} alt={r.title} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 grid place-items-center text-sm text-muted-foreground border-b">No photo</div>
                    )}
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate" title={r.title}>{r.title}</h3>
                        <Rating value={r.rating} onChange={(v)=>{ const next = reviews.map(x => x.id === r.id ? { ...x, rating: v } : x); persist(next); }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                      {r.notes && <p className="text-sm mt-2 whitespace-pre-wrap">{r.notes}</p>}
                      <div className="flex justify-end mt-2">
                        <Button size="sm" variant="destructive" onClick={()=>deleteReview(r.id)}>Delete</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
