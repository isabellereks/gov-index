import type { NewsItem } from "@/types";

interface NewsSectionProps {
  news: NewsItem[];
}

export default function NewsSection({ news }: NewsSectionProps) {
  return (
    <div className="flex flex-col">
      {news.map((item, idx) => (
        <a
          key={item.id}
          href={item.url}
          className={`block py-3 ${idx !== news.length - 1 ? "border-b border-black/[.06]" : ""}`}
        >
          <div className="text-sm text-ink hover:underline tracking-tight">
            {item.headline}
          </div>
          <div className="text-xs text-muted mt-1">
            {item.source} · {item.date}
          </div>
        </a>
      ))}
    </div>
  );
}
