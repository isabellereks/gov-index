import type { Legislator } from "@/types";
import StanceBadge from "@/components/ui/StanceBadge";

interface KeyFiguresProps {
  figures: Legislator[];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

export default function KeyFigures({ figures }: KeyFiguresProps) {
  return (
    <div className="flex flex-col gap-1">
      {figures.map((figure) => (
        <a
          key={figure.id}
          href="#"
          className="flex items-start gap-3 -mx-2 px-2 py-2 rounded-xl hover:bg-bg/60 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-black/[.04] flex-shrink-0 flex items-center justify-center text-xs font-medium text-muted">
            {getInitials(figure.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-ink tracking-tight">
              {figure.name}
            </div>
            <div className="text-xs text-muted">
              {figure.role} · {figure.party}
            </div>
            <div className="mt-1.5">
              <StanceBadge stance={figure.stance} size="sm" />
            </div>
            {figure.quote && (
              <p className="text-xs italic text-muted mt-2 pl-3 border-l border-black/[.06]">
                {figure.quote}
              </p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
