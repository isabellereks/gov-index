import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About · Track Policy",
};

export default function AboutPage() {
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
          About
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold text-ink tracking-tight leading-[1.05] mb-10">
          What this is
        </h1>

        <div className="text-base text-ink/80 leading-relaxed space-y-5">
          <p>
            I built{" "}
            <a
              href="https://trackpolicy.org"
              className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
            >
              trackpolicy.org
            </a>{" "}
            because I kept wanting a straightforward
            answer to one question: where does this state or country stand
            on AI and data centers? To actually answer it I had to check
            legislature portals, read scattered news, and dig through
            industry filings. Nobody was collecting it in one place, so
            I did.
          </p>
          <p>
            Policy is also the part of this that gets the least attention.
            Most of the conversation around AI is about chips and models.
            But where compute gets built, how much it costs the grid, and
            what governments will allow AI to do in schools, courts, and
            hospitals is being decided right now in state capitols and
            agency filings. I wanted a map.
          </p>
          <p>
            Every country, US state, and bloc on the site has a stance and
            a set of impact tags based on the bills currently moving
            through it. Click a region to see its legislation, who&rsquo;s
            sponsoring what, recent news, and the data centers already on
            the ground.
          </p>
          <p>
            I was inspired by{" "}
            <a
              href="https://datacenterbans.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
            >
              datacenterbans.com
            </a>
            , which tracks US-state data center moratoriums. Track Policy
            covers more jurisdictions and more kinds of policy: not only
            bans, but also incentives, disclosure rules, and study bills.
          </p>
          <p>
            One of the things that pushed me to build this is how often
            the public debate around data centers and AI runs on
            intuition rather than detail. A lot of lawmakers writing these
            bills are doing their best, but tech moves faster than most
            committee staff can keep up with, and the headlines they
            read from aren&rsquo;t always accurate about load growth,
            water use, or what these facilities actually do. That gap
            produces policy that sometimes misses the real issue in
            either direction, whether it&rsquo;s a blanket moratorium on
            a site that wouldn&rsquo;t have strained the grid, or an
            incentive package for a build that quietly locks ratepayers
            into decades of higher bills.
          </p>
          <p>
            Track Policy isn&rsquo;t trying to take a side on whether
            any particular bill is good. It&rsquo;s trying to show you
            what&rsquo;s actually being proposed, what stage it&rsquo;s
            at, and what it would do if it passed, so the people affected
            can make up their own minds with the real information in
            front of them.
          </p>

          <div className="pt-5 mt-5 border-t border-black/[.06]">
            <p className="text-muted">
              This is still early. I&rsquo;m open to feedback and edits.
              The repo is public at{" "}
              <a
                href="https://github.com/isabellereks/track-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
              >
                github.com/isabellereks/track-policy
              </a>
              , so you can open an issue or send a PR. You can also{" "}
              <Link
                href="/contact"
                className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
              >
                email me
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-black/[.06]">
          <div className="text-[13px] font-medium text-muted tracking-tight mb-4">
            Credits
          </div>
          <ul className="text-sm text-ink/80 leading-relaxed space-y-2">
            <li>
              Inspired by{" "}
              <a
                href="https://datacenterbans.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
              >
                datacenterbans.com
              </a>
            </li>
            <li>
              Icons by{" "}
              <a
                href="https://streamlinehq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
              >
                Streamline
              </a>
            </li>
            <li>
              Built by{" "}
              <a
                href="https://isabellereks.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
              >
                Isabelle Reksopuro
              </a>
            </li>
            <li className="pt-2 text-muted">
              Full data sources are listed on the{" "}
              <Link
                href="/methodology"
                className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
              >
                methodology
              </Link>{" "}
              page.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}

