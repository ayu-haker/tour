import { SiteLayout } from "@/components/layout/SiteLayout";

export default function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <p className="mt-6 text-sm text-muted-foreground">This is a placeholder page. Ask to fill in this page with the exact features you want and it will be implemented.</p>
      </div>
    </SiteLayout>
  );
}
