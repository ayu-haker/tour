import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export default function CameraCapture({
  onCapture,
}: {
  onCapture: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  const stopStream = useCallback(() => {
    setStream((s) => {
      s?.getTracks().forEach((t) => t.stop());
      return null;
    });
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  async function requestAccess() {
    setError(null);
    setRequesting(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (e: any) {
      const name = e?.name || "Error";
      if (name === "NotAllowedError")
        setError(
          "Camera permission denied or dismissed. Enable camera access in your browser settings and retry.",
        );
      else if (name === "NotFoundError")
        setError("No camera found on this device.");
      else if (name === "NotReadableError")
        setError(
          "Camera is in use by another application. Close it and try again.",
        );
      else setError("Unable to access camera.");
      stopStream();
      console.error(e);
    } finally {
      setRequesting(false);
    }
  }

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL("image/jpeg", 0.9));
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (dataUrl) onCapture(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const isSecure =
    typeof window !== "undefined" ? window.isSecureContext : true;

  return (
    <div className="space-y-3">
      {!stream && (
        <div className="space-y-2">
          {!isSecure && (
            <p className="text-sm text-amber-600">
              Open over HTTPS to use the camera, or upload a photo instead.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={requestAccess} disabled={requesting}>
              {requesting ? "Requesting…" : "Enable Camera"}
            </Button>
            <label className="inline-flex">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onPickFile}
              />
              <Button type="button" variant="outline">
                Upload Photo
              </Button>
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      <div className={stream ? "block" : "hidden"}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full max-h-[60vh] object-contain rounded-md border"
        />
        <div className="mt-2 flex items-center gap-2">
          <Button type="button" onClick={capture}>
            Capture
          </Button>
          <Button type="button" variant="outline" onClick={requestAccess}>
            Retry
          </Button>
          <Button type="button" variant="ghost" onClick={stopStream}>
            Stop
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
