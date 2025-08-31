import { useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import CameraCapture from "@/components/media/CameraCapture";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadJSON, saveJSON } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

const MEM_KEY = "tour.memories";

export default function Profile(){
  const { user, logout } = useAuth();
  const [mems, setMems] = useState<string[]>(() => loadJSON<string[]>(MEM_KEY, []));

  function onCapture(dataUrl: string){
    const next = [dataUrl, ...mems];
    setMems(next);
    saveJSON(MEM_KEY, next);
  }

  if (!user) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md text-center">
          <p className="text-lg">Please login to access your personal space.</p>
          <Button asChild className="mt-4"><Link to="/login">Login</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
        <Button variant="outline" onClick={logout}>Logout</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <Card>
          <CardHeader><CardTitle>Camera</CardTitle></CardHeader>
          <CardContent>
            <CameraCapture onCapture={onCapture} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Memories</CardTitle></CardHeader>
          <CardContent>
            {mems.length === 0 ? <p className="text-sm text-muted-foreground">No photos yet.</p> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mems.map((m,i)=>(
                  <img key={i} src={m} className="rounded-md border object-cover w-full h-32" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
