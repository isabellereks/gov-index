import Link from "next/link";
import type { Metadata } from "next";
import NuanceLegend from "@/components/sections/NuanceLegend";

export const metadata: Metadata = {
  title: "Methodology · Track Policy",
};

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-8 py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors mb-16"
        >
          ← Back
        </Link>

        <div className="text-[13px] font-medium text-muted tracking-tight mb-3">
          Methodology
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold text-ink tracking-tight leading-[1.05] mb-10">
          How I build the data
        </h1>

        <div className="text-base text-ink/80 leading-relaxed space-y-5">
          <p>
            If you read something wrong,{" "}
            <a
              href="mailto:reksopuro.isabelle@gmail.com"
              className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
            >
              please let me know
            </a>
            .
          </p>

          <h2 className="text-xl font-semibold text-ink tracking-tight pt-4">
            Where the bills come from
          </h2>
          <p>
            Every bill comes from an official source. US state bills come
            through{" "}
            <a
              href="https://legiscan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
            >
              LegiScan
            </a>
            . Federal bills come from congress.gov. EU bills come from
            EUR-Lex, and other jurisdictions use their own government
            sources.
          </p>

          <h2 className="text-xl font-semibold text-ink tracking-tight pt-4">
            How bills get tagged
          </h2>
          <p>
            Each bill gets a set of{" "}
            <strong className="text-ink font-semibold">impact tags</strong>
            . Examples include grid capacity, water consumption, carbon
            emissions, local control, AI safety, and deepfake regulation.
            Tags describe what a bill is about. They don&rsquo;t say
            whether it&rsquo;s good or bad.
          </p>
          <p>
            Tagging is done with Claude Sonnet 4.6. The model reads each
            bill&rsquo;s summary and picks the applicable tags from a
            fixed taxonomy. I spot-check the output but I don&rsquo;t
            hand-review every bill.
          </p>

          <h2 className="text-xl font-semibold text-ink tracking-tight pt-4">
            How stance gets picked
          </h2>
          <p>
            A jurisdiction&rsquo;s{" "}
            <strong className="text-ink font-semibold">stance</strong> can
            be restrictive, concerning, review, favorable, or none. Claude
            Sonnet 4.6 picks it from the direction and weight of each
            jurisdiction&rsquo;s active bills. Enacted bills count more
            than voted, voted more than committee, committee more than
            filed.
          </p>
          <p>
            When a jurisdiction has contradictory bills in flight, it
            gets labeled &ldquo;review&rdquo; instead of one side. When
            there&rsquo;s no policy activity at all, it&rsquo;s
            &ldquo;none,&rdquo; not favorable-by-default.
          </p>
          <p>
            Some of these calls will be wrong, or will age badly as bills
            move. If you work in one of these jurisdictions and think the
            read is off,{" "}
            <Link
              href="/contact"
              className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
            >
              please reach out
            </Link>
            .
          </p>

          <h2 className="text-xl font-semibold text-ink tracking-tight pt-4">
            Data centers
          </h2>
          <p>
            The frontier data center layer comes from{" "}
            <a
              href="https://epochai.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
            >
              Epoch AI
            </a>
            &rsquo;s open dataset (CC-BY). I supplement it with
            hand-researched entries from public reporting for sites
            Epoch doesn&rsquo;t cover yet. Cost and compute figures only
            appear when the operator or a filing has disclosed them. A
            missing number means unknown, not zero.
          </p>
        </div>

        <div className="mt-16 pt-10 border-t border-black/[.06] space-y-8">
          <div>
            <div className="text-[13px] font-medium text-muted tracking-tight mb-1">
              Sources
            </div>
            <p className="text-[13px] text-muted leading-relaxed max-w-prose">
              Every dataset is drawn from a public source. Primary links
              for individual bills and news items stay in the detail
              panels; this is the rollup.
            </p>
          </div>

          <SourceGroup title="Legislation">
            <SourceItem
              name="LegiScan"
              href="https://legiscan.com"
              note="US state and federal bill text, sponsors, progress events"
            />
            <SourceItem
              name="Congress.gov"
              href="https://www.congress.gov"
              note="federal bill authoritative source"
            />
            <SourceItem
              name="unitedstates/congress-legislators"
              href="https://github.com/unitedstates/congress-legislators"
              note="current member roster and identifiers"
            />
            <SourceItem
              name="EUR-Lex"
              href="https://eur-lex.europa.eu"
              note="EU primary legislation text (AI Act, Energy Efficiency Directive)"
            />
            <SourceItem
              name="European Parliament"
              href="https://www.europarl.europa.eu"
              note="MEP roster and votes"
            />
            <SourceItem
              name="State legislature portals"
              note="per-bill source links (Arizona, Kentucky, Washington, Montana, West Virginia, Arkansas, California, and 40+ others)"
            />
          </SourceGroup>

          <SourceGroup title="Data centers">
            <SourceItem
              name="Epoch AI — Data on AI"
              href="https://epoch.ai/data/data-centers"
              note="frontier data center inventory (CC-BY 4.0)"
            />
            <SourceItem
              name="Public reporting"
              note="operator announcements, planning filings, and local news for sites Epoch doesn't yet cover"
            />
          </SourceGroup>

          <SourceGroup title="Politicians">
            <SourceItem
              name="unitedstates/images"
              href="https://github.com/unitedstates/images"
              note="official congressional portraits (public domain)"
            />
            <SourceItem
              name="FEC (Federal Election Commission)"
              href="https://www.fec.gov"
              note="campaign finance, donor, and PAC data"
            />
            <SourceItem
              name="DIME database"
              href="https://data.stanford.edu/dime"
              note="Adam Bonica's ideology scores for US legislators"
            />
          </SourceGroup>

          <SourceGroup title="Energy & infrastructure">
            <SourceItem
              name="U.S. Energy Information Administration (EIA)"
              href="https://www.eia.gov/opendata/"
              note="power plant capacity and state generation profiles"
            />
            <SourceItem
              name="Natural Earth"
              href="https://www.naturalearthdata.com"
              note="country borders and water features (public domain)"
            />
          </SourceGroup>

          <SourceGroup title="Maps & geocoding">
            <SourceItem
              name="us-atlas / world-atlas (Mike Bostock)"
              href="https://github.com/topojson/us-atlas"
              note="topojson geography bundles"
            />
            <SourceItem
              name="react-simple-maps"
              href="https://www.react-simple-maps.io"
              note="map rendering primitives"
            />
            <SourceItem
              name="Nominatim (OpenStreetMap)"
              href="https://nominatim.openstreetmap.org"
              note="facility geocoding (ODbL)"
            />
            <SourceItem
              name="CARTO basemaps"
              href="https://carto.com/basemaps"
              note="tile layer for the facility detail view"
            />
          </SourceGroup>

          <SourceGroup title="News">
            <SourceItem
              name="RSS & public article feeds"
              note="Ars Technica, Reuters, The Hill, Politico, state-press outlets, policy-analysis blogs (BABL.ai, ALEC, state-specific mirrors)"
            />
          </SourceGroup>

          <SourceGroup title="Classification & summarization">
            <SourceItem
              name="Anthropic — Claude"
              href="https://www.anthropic.com"
              note="bill categorization, stance inference, multi-dimension classification, and blurb summarization across every regenerated dataset"
            />
          </SourceGroup>
        </div>

        <div className="mt-16 mb-3 text-[13px] font-medium text-muted tracking-tight">
          Impact tags by dimension
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight leading-[1.1] mb-6">
          The full tag taxonomy
        </h2>
        <p className="text-base text-ink/80 leading-relaxed mb-8">
          Tags are grouped into two lenses: Data Centers and AI Regulation.
          Each lens has its own set of dimensions. The map&rsquo;s{" "}
          &ldquo;Color map by&rdquo; toggle uses these groupings to recolor
          jurisdictions by tag density.
        </p>
        <NuanceLegend />
      </div>
    </main>
  );
}

function SourceGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[11px] font-medium text-muted tracking-tight mb-2">
        {title}
      </h3>
      <ul className="text-sm text-ink/80 leading-relaxed space-y-1.5">
        {children}
      </ul>
    </div>
  );
}

function SourceItem({
  name,
  href,
  note,
}: {
  name: string;
  href?: string;
  note?: string;
}) {
  return (
    <li>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
        >
          {name}
        </a>
      ) : (
        <span className="text-ink">{name}</span>
      )}
      {note && <span className="text-muted"> — {note}</span>}
    </li>
  );
}
