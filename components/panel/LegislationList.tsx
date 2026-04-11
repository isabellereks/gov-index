import type { Legislation, Stage } from "@/types";

interface LegislationListProps {
  legislation: Legislation[];
}

const PIPELINE: Stage[] = ["Filed", "Committee", "Floor", "Enacted"];

function progressFor(stage: Stage): number {
  // Where the bar fills to. Carried Over / Dead reuse the Committee mark
  // since most stuck bills die there.
  switch (stage) {
    case "Filed":
      return 0.18;
    case "Committee":
      return 0.42;
    case "Floor":
      return 0.7;
    case "Enacted":
      return 1;
    case "Carried Over":
      return 0.42;
    case "Dead":
      return 0.42;
  }
}

function barColorFor(stage: Stage): string {
  if (stage === "Enacted") return "bg-stance-favorable";
  if (stage === "Dead") return "bg-stance-concerning";
  if (stage === "Carried Over") return "bg-muted/50";
  return "bg-stance-review";
}

function BillTimeline({ stage }: { stage: Stage }) {
  const isTerminal = stage === "Dead" || stage === "Carried Over";
  const overlayColor =
    stage === "Dead" ? "text-stance-concerning" : "text-muted italic";

  return (
    <div className="mt-3">
      <div className="h-1 bg-black/[.06] rounded-full overflow-hidden">
        <div
          className={`h-full ${barColorFor(stage)} rounded-full transition-all duration-300`}
          style={{ width: `${progressFor(stage) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {PIPELINE.map((s) => {
          const isCurrent = s === stage;
          return (
            <span
              key={s}
              className={`text-[10px] tracking-tight ${
                isCurrent ? "text-ink font-medium" : "text-muted"
              }`}
            >
              {s}
            </span>
          );
        })}
      </div>
      {isTerminal && (
        <div className={`text-[11px] mt-1.5 ${overlayColor}`}>
          Stage: {stage}
        </div>
      )}
    </div>
  );
}

export default function LegislationList({ legislation }: LegislationListProps) {
  return (
    <div className="flex flex-col gap-3">
      {legislation.map((bill) => (
        <a
          key={bill.id}
          href={bill.sourceUrl ?? "#"}
          target={bill.sourceUrl ? "_blank" : undefined}
          rel={bill.sourceUrl ? "noopener noreferrer" : undefined}
          className="block bg-bg/60 rounded-2xl p-4 hover:bg-bg transition-colors"
        >
          <div className="text-xs text-muted">{bill.billCode}</div>
          <div className="text-sm font-medium mt-1 text-ink tracking-tight">
            {bill.title}
          </div>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            {bill.summary}
          </p>
          <BillTimeline stage={bill.stage} />
        </a>
      ))}
    </div>
  );
}
