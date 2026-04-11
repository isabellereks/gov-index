"use client";

import { Fragment } from "react";

export interface BreadcrumbItem {
  label: string;
  /** When present, clicking this item triggers the click handler. */
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      className="flex items-center text-xs tracking-tight"
      aria-label="Breadcrumb"
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <Fragment key={`${item.label}-${idx}`}>
            {item.onClick && !isLast ? (
              <button
                type="button"
                onClick={item.onClick}
                className="text-muted hover:text-ink cursor-pointer transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className={isLast ? "text-ink" : "text-muted"}>
                {item.label}
              </span>
            )}
            {!isLast && <span className="text-muted mx-1.5">›</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
