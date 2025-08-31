import Spline from "@splinetool/react-spline";

export function BackgroundCanvas() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <Spline scene="https://my.spline.design/worldplanet-V69FILemXdD05O9q16QQyccZ/" style={{ width: "100%", height: "100%" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/10 to-background/0" />
    </div>
  );
}
