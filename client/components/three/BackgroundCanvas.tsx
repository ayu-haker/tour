import { useIsMobile } from "@/hooks/use-mobile";

export function BackgroundCanvas({ dark = false }: { dark?: boolean }) {
  const isMobile = useIsMobile();
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // On mobile or when user prefers reduced motion, avoid heavy 3D iframe
  if (isMobile || prefersReducedMotion) {
    return (
      <div
        className={
          dark
            ? "pointer-events-none fixed inset-0 z-0 block bg-slate-950"
            : "pointer-events-none fixed inset-0 z-0 block"
        }
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: dark
              ? "linear-gradient(rgba(2, 6, 23, 0.8), rgba(2, 6, 23, 0.6))"
              : "linear-gradient(rgba(2, 6, 23, 0.6), rgba(2, 6, 23, 0.4))",
          }}
        />
        <div className="pointer-events-none absolute bottom-0 right-0 h-10 w-44 md:w-64 bg-background/80" />
      </div>
    );
  }

  const containerClass = dark
    ? "pointer-events-none fixed inset-0 z-0 block bg-slate-950"
    : "pointer-events-none fixed inset-0 z-0 block";
  const iframeStyle: React.CSSProperties = dark
    ? { pointerEvents: "none", backgroundColor: "#020617" }
    : { pointerEvents: "none" };
  const overlay = dark
    ? "linear-gradient(rgba(2, 6, 23, 0.6), rgba(2, 6, 23, 0.45), rgba(2, 6, 23, 0.35))"
    : "linear-gradient(rgba(2, 6, 23, 0.75), rgba(2, 6, 23, 0.5), rgba(2, 6, 23, 0.35))";
  return (
    <div className={containerClass}>
      <iframe
        src="https://my.spline.design/worldplanet-V69FILemXdD05O9q16QQyccZ/"
        className="h-full w-full"
        frameBorder="0"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        aria-label="3D background"
        style={iframeStyle}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: overlay }}
      />
      <div className="pointer-events-none absolute bottom-0 right-0 h-12 w-56 md:w-64 bg-background/90" />
    </div>
  );
}
