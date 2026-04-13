import type { Stage } from "@/types";

const PIPELINE: Stage[] = ["Filed", "Committee", "Floor", "Enacted"];

const STAGE_SHORT: Record<Stage, string> = {
  Filed: "Filed",
  Committee: "In committee",
  Floor: "Floor vote",
  Enacted: "Enacted",
  "Carried Over": "Carried over",
  Dead: "Dead",
};

function progressFor(stage: Stage): number {
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

export default function BillTimeline({ stage }: { stage: Stage }) {
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
              {STAGE_SHORT[s]}
            </span>
          );
        })}
      </div>
      {isTerminal && (
        <div className={`text-[11px] mt-1.5 ${overlayColor}`}>
          {STAGE_SHORT[stage]}
        </div>
      )}
    </div>
  );
}
