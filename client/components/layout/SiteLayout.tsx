import { PropsWithChildren } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function SiteLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <main className="container py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
