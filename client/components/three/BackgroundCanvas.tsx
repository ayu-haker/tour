export function BackgroundCanvas() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 block bg-slate-950">
      <iframe
        src="https://my.spline.design/worldplanet-V69FILemXdD05O9q16QQyccZ/"
        className="h-full w-full"
        frameBorder="0"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        aria-label="3D background"
        style={{ pointerEvents: "none", backgroundColor: "#020617" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2, 6, 23, 0.88), rgba(2, 6, 23, 0.7), rgba(2, 6, 23, 0.55))",
        }}
      />
      <div className="pointer-events-none absolute bottom-0 right-0 h-12 w-56 md:w-64 bg-background/90" />
    </div>
  );
}
