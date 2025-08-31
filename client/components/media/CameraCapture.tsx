import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export default function CameraCapture({ onCapture }: { onCapture: (dataUrl: string) => void }){
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { stream?.getTracks().forEach(t=>t.stop()); };
  }, []);

  function capture(){
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL('image/jpeg', 0.9));
  }

  return (
    <div className="space-y-3">
      <video ref={videoRef} autoPlay playsInline className="w-full rounded-md border" />
      <Button type="button" onClick={capture}>Capture</Button>
    </div>
  );
}
