export function BackgroundCanvas() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <iframe
        src="https://my.spline.design/worldplanet-V69FILemXdD05O9q16QQyccZ/"
        className="h-full w-full"
        frameBorder="0"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        aria-label="3D background"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/10 to-background/0" />
    </div>
  );
}
