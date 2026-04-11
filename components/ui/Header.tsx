export default function Header() {
  return (
    <header className="h-12 bg-white/70 backdrop-blur-xl border-b border-black/[.06] px-6 flex items-center justify-between fixed top-0 left-0 right-0 z-40">
      <div className="text-sm font-semibold text-ink">
        TRACK POLICY
      </div>
      <nav className="flex items-center gap-6 text-xs text-muted">
        <span>Map</span>
        <span>Legislators</span>
        <span>About</span>
      </nav>
    </header>
  );
}
