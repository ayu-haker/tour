import { useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";

type TouristPlace = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: string;
  state: string;
  price: string;
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

export default function Explore() {
  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState("");

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
                  <p>{place.state}</p>
                  <p className="text-sm">Type: {place.type}</p>
                  <p className="text-sm font-medium">Entry Fee: {place.price}</p>
                  <p className="text-xs">📍 Lat: {place.lat}, Lon: {place.lon}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
