export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="container py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} TOUR. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a className="hover:text-foreground" href="#">Privacy</a>
          <a className="hover:text-foreground" href="#">Terms</a>
          <a className="hover:text-foreground" href="#">Contact</a>
        </div>
      </div>
    </footer>
  );
}
