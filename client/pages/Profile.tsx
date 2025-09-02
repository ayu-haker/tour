import { useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import CameraCapture from "@/components/media/CameraCapture";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadJSON, saveJSON } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

const MEM_KEY = "tour.memories";
const PROFILE_KEY = "tour.profile.v1";
const REV_KEY = "tour.placeReviews.v1";
const USER_PLACES_KEY = "tour.userPlaces";
const MY_REQ_KEY = "tour.myRequests";

type ProfileData = {
  name: string;
  avatar: string | null; // data URL
  theme: "system" | "light" | "dark";
  notifications: boolean;
};

export default function Profile() {
  const { user, logout } = useAuth();
  const [mems, setMems] = useState<string[]>(() =>
    loadJSON<string[]>(MEM_KEY, []),
  );
  const [prof, setProf] = useState<ProfileData>(() =>
    loadJSON<ProfileData>(PROFILE_KEY, {
      name: "",
      avatar: null,
      theme: "system",
      notifications: true,
    }),
  );
  const [reviews, setReviews] = useState(() =>
    loadJSON<any[]>(REV_KEY, []),
  );
  const [savedPlaces, setSavedPlaces] = useState(() =>
    loadJSON<any[]>(USER_PLACES_KEY, []),
  );
  const [myRequests, setMyRequests] = useState<string[]>(() =>
    loadJSON<string[]>(MY_REQ_KEY, []),
  );
  const [reqs, setReqs] = useState<any[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);

  function persistProfile(next: ProfileData) {
    setProf(next);
    saveJSON(PROFILE_KEY, next);
    applyTheme(next.theme);
  }

  function onCapture(dataUrl: string) {
    const next = [dataUrl, ...mems];
    setMems(next);
    saveJSON(MEM_KEY, next);
  }

  function removeMemory(i: number) {
    const next = mems.filter((_, idx) => idx !== i);
    setMems(next);
    saveJSON(MEM_KEY, next);
  }

  function downloadMemory(i: number) {
    const a = document.createElement("a");
    a.href = mems[i];
    a.download = `memory-${i + 1}.png`;
    a.click();
  }

  function applyTheme(t: "system" | "light" | "dark") {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (t === "dark") root.classList.add("dark");
    if (t === "light") root.classList.add("light");
    localStorage.setItem("theme", t);
  }

  useEffect(() => {
    // apply saved theme on mount
    applyTheme(prof.theme);
  }, []);

  useEffect(() => {
    async function load() {
      setLoadingReqs(true);
      try {
        const r = await fetch("/api/requests");
        const all = (await r.json()) as any[];
        const mine = myRequests.length
          ? all.filter((x) => myRequests.includes(String(x.id)))
          : [];
        setReqs(mine);
      } catch {
        setReqs([]);
      } finally {
        setLoadingReqs(false);
      }
    }
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [myRequests.join(",")]);

  function removePlace(id: string) {
    const next = savedPlaces.filter((p: any) => p.id !== id);
    setSavedPlaces(next);
    saveJSON(USER_PLACES_KEY, next);
  }

  function deleteReview(id: string) {
    const next = reviews.filter((r: any) => r.id !== id);
    setReviews(next);
    saveJSON(REV_KEY, next);
  }

  if (!user) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md text-center">
          <p className="text-lg">Please login to access your personal space.</p>
          <Button asChild className="mt-4">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      <Tabs defaultValue="account" className="mt-6">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
          <TabsTrigger value="reviews">My Reviews</TabsTrigger>
          <TabsTrigger value="places">Saved Places</TabsTrigger>
          <TabsTrigger value="memories">Memories</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Your name"
                  value={prof.name}
                  onChange={(e) =>
                    persistProfile({ ...prof, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Avatar</Label>
                {prof.avatar ? (
                  <img
                    src={prof.avatar}
                    alt="avatar"
                    className="h-24 w-24 rounded-full border object-cover"
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No avatar set
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = () => {
                        const f = (input.files || [])[0];
                        if (!f) return;
                        const rd = new FileReader();
                        rd.onload = () =>
                          persistProfile({ ...prof, avatar: String(rd.result) });
                        rd.readAsDataURL(f);
                      };
                      input.click();
                    }}
                  >
                    Upload
                  </Button>
                  <Button
                    onClick={() =>
                      persistProfile({ ...prof, avatar: null })
                    }
                    variant="destructive"
                  >
                    Remove
                  </Button>
                </div>
                <div className="mt-3">
                  <Label>Capture from camera</Label>
                  <div className="max-w-sm mt-1">
                    <CameraCapture
                      onCapture={(d) => persistProfile({ ...prof, avatar: d })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>My Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReqs ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : reqs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No requests yet.
                </p>
              ) : (
                <div className="grid gap-3">
                  {reqs.map((r) => (
                    <div key={r.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {String(r.type).toUpperCase()} •
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            {new Date(r.created_at).toLocaleString()}
                          </span>
                        </div>
                        <span className="text-xs rounded-full border px-2 py-0.5">
                          {r.status}
                        </span>
                      </div>
                      <pre className="mt-2 text-xs bg-muted/30 rounded p-2 whitespace-pre-wrap break-words">
                        {JSON.stringify(r.payload, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>My Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="border rounded-md overflow-hidden bg-card">
                      {r.dataUrl ? (
                        <img src={r.dataUrl} alt={r.title} className="w-full h-40 object-cover" />
                      ) : (
                        <div className="w-full h-40 grid place-items-center text-sm text-muted-foreground border-b">No photo</div>
                      )}
                      <div className="p-3">
                        <div className="font-medium truncate" title={r.title}>{r.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(r.createdAt).toLocaleString()}
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button size="sm" variant="destructive" onClick={() => deleteReview(r.id)}>Delete</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="places" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Places</CardTitle>
            </CardHeader>
            <CardContent>
              {savedPlaces.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved places yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {savedPlaces.map((p: any) => (
                    <div key={p.id} className="border rounded-md p-3">
                      <div className="font-medium">{p.title || p.name || "Place"}</div>
                      <div className="text-xs text-muted-foreground">
                        {Array.isArray(p.position) ? `${p.position[0]}, ${p.position[1]}` : ""}
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button size="sm" variant="destructive" onClick={() => removePlace(p.id)}>Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memories" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Camera</CardTitle>
              </CardHeader>
              <CardContent>
                <CameraCapture onCapture={onCapture} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Memories</CardTitle>
              </CardHeader>
              <CardContent>
                {mems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No photos yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {mems.map((m, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={m}
                          className="rounded-md border object-cover w-full h-32"
                          alt={`memory-${i + 1}`}
                        />
                        <div className="absolute inset-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 justify-end items-start">
                          <Button size="icon" variant="secondary" onClick={() => downloadMemory(i)}>
                            ⬇
                          </Button>
                          <Button size="icon" variant="destructive" onClick={() => removeMemory(i)}>
                            ✕
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Theme</Label>
                <select
                  value={prof.theme}
                  onChange={(e) => persistProfile({ ...prof, theme: e.target.value as any })}
                  className="border rounded p-2 bg-background"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Notifications</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="notif"
                    type="checkbox"
                    checked={prof.notifications}
                    onChange={(e) =>
                      persistProfile({ ...prof, notifications: e.target.checked })
                    }
                  />
                  <label htmlFor="notif" className="text-sm">
                    Enable basic notifications
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </SiteLayout>
  );
}
