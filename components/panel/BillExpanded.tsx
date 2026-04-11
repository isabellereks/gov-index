"use client";

import {
  IMPACT_TAG_LABEL,
  CATEGORY_LABEL,
  STANCE_LABEL,
  type Legislation,
} from "@/types";
import {
  findDonor,
  formatMoney,
  isDonorRelevant,
  type DonorProfile,
} from "@/lib/donor-data";

interface BillExpandedProps {
  bill: Legislation;
  /** Two-letter state code for donor lookup. "US" for federal, "VA" etc. for states. */
  stateCode?: string;
}

/**
 * Inline details that appear when a bill card is expanded. Used by both
 * LegislationList (side panel) and LegislationTable (home page section).
 * Keeps layout tight so it fits inside a ~22rem side panel.
 */
export default function BillExpanded({ bill, stateCode }: BillExpandedProps) {
  const isFederal = stateCode === "US";
  const sponsors = bill.sponsors ?? [];

  // Only look up donors for federal bills — state legislators aren't in
  // the FEC dataset so any "match" would be a false positive by last name.
  const sponsorProfiles = isFederal
    ? sponsors.map((name) => ({ name, profile: findDonor(name, stateCode) }))
    : sponsors.map((name) => ({ name, profile: null as DonorProfile | null }));

  const href = bill.legiscanUrl ?? bill.sourceUrl;

  return (
    <div className="pt-4 mt-4 border-t border-black/[.06] flex flex-col gap-4">
      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
        <span>{CATEGORY_LABEL[bill.category]}</span>
        {bill.stance && (
          <>
            <span aria-hidden>·</span>
            <span>{STANCE_LABEL[bill.stance]}</span>
          </>
        )}
        {bill.partyOrigin && (
          <>
            <span aria-hidden>·</span>
            <span>
              {bill.partyOrigin === "B"
                ? "Bipartisan"
                : bill.partyOrigin === "D"
                  ? "Democrat"
                  : "Republican"}
            </span>
          </>
        )}
        <span aria-hidden>·</span>
        <span>Updated {bill.updatedDate}</span>
      </div>

      {/* Impact tags */}
      {bill.impactTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {bill.impactTags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] bg-black/[.04] text-muted px-2 py-0.5 rounded-full"
            >
              {IMPACT_TAG_LABEL[tag]}
            </span>
          ))}
        </div>
      )}

      {/* Sponsors */}
      {sponsors.length > 0 && (
        <div>
          <div className="text-[11px] font-medium text-muted tracking-tight mb-2">
            {isFederal ? "Sponsors & donor cross-reference" : "Sponsors"}
          </div>
          {isFederal ? (
            <div className="flex flex-col gap-2">
              {sponsorProfiles.map(({ name, profile }) => (
                <SponsorRow
                  key={name}
                  name={name}
                  profile={profile}
                  billCategory={bill.category}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted leading-relaxed">
              {sponsors.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Full-text link */}
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="self-start inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline"
        >
          View full bill →
        </a>
      )}
    </div>
  );
}

function SponsorRow({
  name,
  profile,
  billCategory,
}: {
  name: string;
  profile: DonorProfile | null;
  billCategory: Legislation["category"];
}) {
  if (!profile) {
    return (
      <div className="text-xs text-ink">
        {name}
        <span className="text-muted ml-2 text-[11px]">
          no federal donor data
        </span>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-black/[.02] p-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xs font-medium text-ink">
          {profile.name}{" "}
          <span className="text-muted font-normal">
            ({profile.party}-{profile.state})
          </span>
        </div>
        <div className="text-[11px] text-muted">
          {formatMoney(profile.totalRaised)} raised
        </div>
      </div>
      {profile.topDonors.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {profile.topDonors.slice(0, 3).map((d, i) => {
            const relevant = isDonorRelevant(d.industry, billCategory);
            return (
              <div
                key={`${d.name}-${i}`}
                className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[11px] ${
                  relevant ? "bg-stance-concerning/15" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-1 h-1 rounded-full flex-shrink-0 ${
                      relevant ? "bg-stance-concerning" : "bg-black/20"
                    }`}
                  />
                  <span className="truncate text-muted">{d.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-muted">{d.industry}</span>
                  <span className="text-ink font-medium">
                    {formatMoney(d.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
