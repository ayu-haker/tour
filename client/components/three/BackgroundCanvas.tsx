export function BackgroundCanvas() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <iframe
        src="https://my.spline.design/worldplanet-V69FILemXdD05O9q16QQyccZ/"
        className="h-full w-full"
        frameBorder="0"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        aria-label="3D background"
        style={{ pointerEvents: "none" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))",
        }}
      />
    </div>
  );
}
