export function BackgroundCanvas() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
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
            "linear-gradient(rgba(2, 6, 23, 0.75), rgba(2, 6, 23, 0.5), rgba(2, 6, 23, 0.35))",
        }}
      />
    </div>
  );
}
