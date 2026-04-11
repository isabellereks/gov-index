import type { Entity, Region } from "@/types";

export const ENTITIES: Entity[] = [
  // ─────────── NORTH AMERICA REGION ───────────
  {
    id: "us-federal",
    geoId: "840",
    name: "United States",
    region: "na",
    level: "federal",
    isOverview: true,
    canDrillDown: true,
    stance: "review",
    contextBlurb:
      "US federal AI and data center policy remains fragmented across agencies. No comprehensive national framework exists. The DOE, EPA, and FERC each regulate different aspects with overlapping and sometimes conflicting priorities.",
    legislation: [
      {
        id: "hr-9482",
        billCode: "H.R. 9482",
        title: "Federal Artificial Intelligence Risk Management Act",
        summary:
          "Directs NIST to operationalize the AI Risk Management Framework across federal agencies and procurement.",
        stage: "Committee",
        tags: ["AI", "NIST", "procurement"],
      },
      {
        id: "s-1304",
        billCode: "S. 1304",
        title: "Clean Energy for Data Centers Act",
        summary:
          "Establishes federal grants for renewable-powered data center retrofits and PUE benchmarks for federally leased facilities.",
        stage: "Floor",
        tags: ["data centers", "energy"],
      },
      {
        id: "hr-7213",
        billCode: "H.R. 7213",
        title: "AI Disclosure and Accountability Act",
        summary:
          "Requires disclosure when consumers interact with generative AI systems and mandates dataset provenance reporting.",
        stage: "Filed",
        tags: ["AI", "disclosure"],
      },
    ],
    keyFigures: [
      {
        id: "us-schumer",
        name: "Chuck Schumer",
        role: "Senator · Senate Majority Leader",
        party: "D-NY",
        stance: "review",
        quote:
          "Congress must act on AI — but we have to get the guardrails right without smothering innovation.",
      },
      {
        id: "us-cantwell",
        name: "Maria Cantwell",
        role: "Senator · Chair, Commerce Committee",
        party: "D-WA",
        stance: "favorable",
        quote:
          "Lead author of S. 1304. Federal data center policy must catch up to the load curve.",
      },
      {
        id: "us-cruz",
        name: "Ted Cruz",
        role: "Senator · Ranking Member, Commerce Committee",
        party: "R-TX",
        stance: "concerning",
      },
      {
        id: "us-klobuchar",
        name: "Amy Klobuchar",
        role: "Senator",
        party: "D-MN",
        stance: "favorable",
      },
      {
        id: "us-warner",
        name: "Mark Warner",
        role: "Senator · Chair, Intelligence Committee",
        party: "D-VA",
        stance: "review",
        quote:
          "Sponsor of H.R. 7213 disclosure provisions in the Senate companion.",
      },
      {
        id: "us-eshoo",
        name: "Anna Eshoo",
        role: "Representative · CA-16",
        party: "D",
        stance: "favorable",
        quote: "Lead House sponsor of the AI Disclosure and Accountability Act.",
      },
      {
        id: "us-beyer",
        name: "Don Beyer",
        role: "Representative · VA-08",
        party: "D",
        stance: "review",
        quote:
          "Northern Virginia carries the grid burden of AI build-out — Congress can't keep ignoring it.",
      },
      {
        id: "us-obernolte",
        name: "Jay Obernolte",
        role: "Representative · CA-23, Co-Chair AI Task Force",
        party: "R",
        stance: "review",
      },
      {
        id: "us-mcmorris",
        name: "Cathy McMorris Rodgers",
        role: "Representative · WA-05, Energy & Commerce",
        party: "R",
        stance: "concerning",
      },
    ],
    news: [
      {
        id: "us-news-1",
        headline: "FERC opens inquiry into co-located data center load",
        source: "Reuters",
        date: "2026-03-30",
        url: "#",
      },
      {
        id: "us-news-2",
        headline: "White House AI council pushes interagency efficiency standards",
        source: "The Washington Post",
        date: "2026-03-18",
        url: "#",
      },
    ],
  },
  {
    id: "virginia",
    geoId: "Virginia",
    name: "Virginia",
    region: "na",
    level: "state",
    stance: "review",
    contextBlurb:
      "Virginia hosts over 35% of global internet traffic through its Northern Virginia data center corridor. HB 1515 proposes a moratorium while HB 2084 enacted a rate classification review.",
    legislation: [
      {
        id: "va-hb1515",
        billCode: "HB 1515",
        title: "Data Center Development Moratorium",
        summary:
          "Imposes a one-year moratorium on data center special-use permits in counties exceeding 5 GW of approved load.",
        stage: "Carried Over",
        tags: ["moratorium", "land use"],
      },
      {
        id: "va-hb2084",
        billCode: "HB 2084",
        title: "Data Center Rate Classification Review",
        summary:
          "Directs the State Corporation Commission to evaluate a separate retail rate class for hyperscale data center customers.",
        stage: "Enacted",
        tags: ["rates", "SCC"],
      },
    ],
    keyFigures: [
      {
        id: "va-subramanyam",
        name: "Suhas Subramanyam",
        role: "Delegate · HD-32 · Lead sponsor, HB 1515",
        party: "D",
        stance: "review",
        quote:
          "Loudoun County families shouldn't subsidize the grid build-out for the largest server farms on Earth.",
      },
      {
        id: "va-boysko",
        name: "Jennifer Boysko",
        role: "State Senator · SD-38 · Co-sponsor, HB 1515",
        party: "D",
        stance: "restrictive",
        quote:
          "We need a moratorium until Dominion can show ratepayers won't bear the cost of hyperscale.",
      },
      {
        id: "va-reid",
        name: "David Reid",
        role: "Delegate · HD-28 · Patron, HB 2084",
        party: "D",
        stance: "favorable",
        quote:
          "Separate rate classification protects residential ratepayers without freezing investment.",
      },
      {
        id: "va-sickles",
        name: "Mark Sickles",
        role: "Delegate · HD-43 · Commerce & Labor Chair",
        party: "D",
        stance: "review",
      },
    ],
    news: [
      {
        id: "va-news-1",
        headline: "Loudoun supervisors freeze new data center rezonings",
        source: "Washington Business Journal",
        date: "2026-03-26",
        url: "#",
      },
      {
        id: "va-news-2",
        headline: "Dominion Energy files revised data center tariff with SCC",
        source: "Richmond Times-Dispatch",
        date: "2026-03-11",
        url: "#",
      },
    ],
  },
  {
    id: "texas",
    geoId: "Texas",
    name: "Texas",
    region: "na",
    level: "state",
    stance: "concerning",
    contextBlurb:
      "Texas offers aggressive tax incentives for data center development with limited environmental safeguards. Water usage in drought-prone regions is a growing concern.",
    legislation: [
      {
        id: "tx-sb1308",
        billCode: "SB 1308",
        title: "Data Center Sales Tax Exemption Extension",
        summary:
          "Extends qualified data center sales-and-use tax exemptions through 2035 with reduced job creation thresholds.",
        stage: "Enacted",
        tags: ["tax", "incentives"],
      },
      {
        id: "tx-hb4422",
        billCode: "HB 4422",
        title: "Large Load Interconnection Standards Act",
        summary:
          "Establishes ERCOT interconnection rules for loads exceeding 75 MW, including curtailment obligations during scarcity events.",
        stage: "Floor",
        tags: ["ERCOT", "grid"],
      },
    ],
    keyFigures: [
      {
        id: "tx-king",
        name: "Phil King",
        role: "State Senator · SD-10 · Lead author, SB 1308",
        party: "R",
        stance: "concerning",
        quote:
          "Texas welcomes the data center boom — government should clear the path, not slow it down.",
      },
      {
        id: "tx-johnson",
        name: "Ann Johnson",
        role: "State Representative · HD-134 · Sponsor, HB 4422",
        party: "D",
        stance: "review",
        quote:
          "ERCOT can't keep saying yes to every interconnection request without curtailment teeth.",
      },
      {
        id: "tx-lujan",
        name: "John Lujan",
        role: "State Representative · HD-118 · Co-author, HB 4422",
        party: "R",
        stance: "review",
      },
    ],
    news: [
      {
        id: "tx-news-1",
        headline: "ERCOT warns of 152 GW long-term load forecast driven by AI",
        source: "Dallas Morning News",
        date: "2026-03-29",
        url: "#",
      },
      {
        id: "tx-news-2",
        headline: "West Texas counties weigh moratoriums amid water concerns",
        source: "Texas Tribune",
        date: "2026-03-14",
        url: "#",
      },
    ],
  },
  {
    id: "california",
    geoId: "California",
    name: "California",
    region: "na",
    level: "state",
    stance: "favorable",
    contextBlurb:
      "California has enacted strong data center efficiency standards requiring renewable energy commitments and community benefit agreements for new developments.",
    legislation: [
      {
        id: "ca-sb253",
        billCode: "SB 253",
        title: "Climate Corporate Data Accountability Act",
        summary:
          "Requires large operators to disclose Scope 1, 2, and 3 emissions, including data center energy and embodied carbon.",
        stage: "Enacted",
        tags: ["disclosure", "emissions"],
      },
      {
        id: "ca-ab2013",
        billCode: "AB 2013",
        title: "Generative AI Training Data Transparency Act",
        summary:
          "Requires developers of generative AI to publish high-level summaries of datasets used to train consumer-facing models.",
        stage: "Enacted",
        tags: ["AI", "transparency"],
      },
    ],
    keyFigures: [
      {
        id: "ca-wiener",
        name: "Scott Wiener",
        role: "State Senator · SD-11 · Lead author, SB 253",
        party: "D",
        stance: "favorable",
        quote:
          "California has always led on tech accountability, and AI is no exception.",
      },
      {
        id: "ca-irwin",
        name: "Jacqui Irwin",
        role: "Assemblymember · AD-42 · Lead author, AB 2013",
        party: "D",
        stance: "favorable",
        quote:
          "Provenance is the floor, not the ceiling, of responsible AI development.",
      },
      {
        id: "ca-stern",
        name: "Henry Stern",
        role: "State Senator · SD-27 · Principal co-author, SB 253",
        party: "D",
        stance: "favorable",
      },
    ],
    news: [
      {
        id: "ca-news-1",
        headline: "CARB finalizes data center reporting rule under SB 253",
        source: "Los Angeles Times",
        date: "2026-03-21",
        url: "#",
      },
      {
        id: "ca-news-2",
        headline: "Newsom signs follow-on AI watermark bill",
        source: "CalMatters",
        date: "2026-03-03",
        url: "#",
      },
    ],
  },
  {
    id: "oregon",
    geoId: "Oregon",
    name: "Oregon",
    region: "na",
    level: "state",
    stance: "restrictive",
    contextBlurb:
      "Oregon passed a moratorium on large-scale data center development near protected watershed areas following community opposition in the Columbia River Gorge.",
    legislation: [
      {
        id: "or-hb2816",
        billCode: "HB 2816",
        title: "Critical Watershed Data Center Moratorium",
        summary:
          "Prohibits new data center siting within designated critical watershed areas through 2030.",
        stage: "Enacted",
        tags: ["moratorium", "water"],
      },
      {
        id: "or-sb471",
        billCode: "SB 471",
        title: "Data Center Energy Source Disclosure",
        summary:
          "Requires annual public reporting of energy mix and water consumption for facilities above 10 MW.",
        stage: "Enacted",
        tags: ["disclosure", "water"],
      },
    ],
    keyFigures: [
      {
        id: "or-marsh",
        name: "Pam Marsh",
        role: "State Representative · HD-5 · Chief sponsor, HB 2816",
        party: "D",
        stance: "restrictive",
        quote:
          "The Columbia River Gorge cannot be the cooling tower for the entire AI industry.",
      },
      {
        id: "or-sollman",
        name: "Janeen Sollman",
        role: "State Senator · SD-15 · Chief sponsor, SB 471",
        party: "D",
        stance: "favorable",
        quote:
          "Disclosure isn't anti-development. It's how we hold operators to their renewable promises.",
      },
      {
        id: "or-helm",
        name: "Ken Helm",
        role: "State Representative · HD-34 · Co-sponsor, HB 2816",
        party: "D",
        stance: "restrictive",
      },
    ],
    news: [
      {
        id: "or-news-1",
        headline: "The Dalles weighs second moratorium on hyperscale projects",
        source: "Oregon Public Broadcasting",
        date: "2026-03-19",
        url: "#",
      },
      {
        id: "or-news-2",
        headline: "PGE forecasts 8 GW data center load by 2030",
        source: "The Oregonian",
        date: "2026-03-06",
        url: "#",
      },
    ],
  },
  {
    id: "new-york",
    geoId: "New York",
    name: "New York",
    region: "na",
    level: "state",
    stance: "review",
    contextBlurb:
      "New York is actively reviewing data center energy demands amid grid strain concerns, particularly in regions dependent on fossil fuel peaker plants.",
    legislation: [
      {
        id: "ny-a8884",
        billCode: "A. 8884",
        title: "Data Center Grid Impact Study Act",
        summary:
          "Directs NYSERDA and the PSC to jointly study the grid impact of large data center loads in upstate New York.",
        stage: "Committee",
        tags: ["study", "grid"],
      },
      {
        id: "ny-s7422",
        billCode: "S. 7422",
        title: "Peaker Plant Replacement and Data Center Siting Act",
        summary:
          "Conditions data center siting approvals on co-investment in peaker plant retirement and storage replacement.",
        stage: "Filed",
        tags: ["peaker", "siting"],
      },
    ],
    keyFigures: [
      {
        id: "ny-fahy",
        name: "Patricia Fahy",
        role: "Assemblymember · AD-109 · Lead sponsor, A. 8884",
        party: "D",
        stance: "review",
        quote:
          "We can't approve gigawatt loads without knowing what they do to upstate ratepayers.",
      },
      {
        id: "ny-harckham",
        name: "Pete Harckham",
        role: "State Senator · SD-40 · Lead sponsor, S. 7422",
        party: "D",
        stance: "restrictive",
        quote:
          "If a data center wants to plug into a peaker, the peaker has to retire. Period.",
      },
      {
        id: "ny-krueger",
        name: "Liz Krueger",
        role: "State Senator · SD-28 · Chair, Finance",
        party: "D",
        stance: "review",
      },
    ],
    news: [
      {
        id: "ny-news-1",
        headline: "PSC opens proceeding on large-load tariff design",
        source: "Albany Times Union",
        date: "2026-03-24",
        url: "#",
      },
      {
        id: "ny-news-2",
        headline: "Hochul administration mulls data center moratorium near peakers",
        source: "Politico New York",
        date: "2026-03-09",
        url: "#",
      },
    ],
  },
  {
    id: "canada-federal",
    geoId: "124",
    name: "Canada",
    region: "na",
    level: "federal",
    stance: "favorable",
    contextBlurb:
      "Canada's proposed Artificial Intelligence and Data Act (AIDA) takes a risk-based approach to AI regulation with strong provincial consultation requirements.",
    legislation: [
      {
        id: "c-27",
        billCode: "C-27",
        title: "Digital Charter Implementation Act (AIDA)",
        summary:
          "Companion legislation creating obligations for high-impact AI systems and establishing an AI and Data Commissioner.",
        stage: "Committee",
        tags: ["AIDA", "AI", "privacy"],
      },
      {
        id: "c-72",
        billCode: "C-72",
        title: "Data Centre Sustainability Reporting Act",
        summary:
          "Requires federally regulated data center operators to report energy mix, water draw, and grid impact annually.",
        stage: "Filed",
        tags: ["data centers", "reporting"],
      },
    ],
    keyFigures: [
      {
        id: "ca-champagne",
        name: "François-Philippe Champagne",
        role: "Minister of Innovation, Science and Industry",
        party: "Liberal",
        stance: "favorable",
        quote:
          "We can lead on responsible AI while keeping Canada the best place to build AI companies.",
      },
      {
        id: "ca-rempel",
        name: "Michelle Rempel Garner",
        role: "MP, Industry Critic",
        party: "Conservative",
        stance: "review",
      },
    ],
    news: [
      {
        id: "ca-news-1",
        headline: "INDU committee holds final AIDA hearings ahead of report stage",
        source: "The Globe and Mail",
        date: "2026-03-25",
        url: "#",
      },
      {
        id: "ca-news-2",
        headline: "Quebec, Alberta press Ottawa on provincial AI carve-outs",
        source: "CBC News",
        date: "2026-03-08",
        url: "#",
      },
    ],
  },

  // ─────────── EU REGION ───────────
  {
    id: "eu-bloc",
    geoId: "eu-bloc",
    name: "European Union",
    region: "eu",
    level: "bloc",
    isOverview: true,
    stance: "favorable",
    contextBlurb:
      "The EU AI Act represents the world's first comprehensive legal framework for artificial intelligence, establishing risk-based requirements for AI systems and strict limits on data center energy consumption.",
    legislation: [
      {
        id: "eu-ai-act",
        billCode: "Reg. 2024/1689",
        title: "Artificial Intelligence Act",
        summary:
          "Risk-based regulation prohibiting unacceptable AI uses, requiring conformity assessments for high-risk systems, and transparency obligations for general-purpose AI models.",
        stage: "Enacted",
        tags: ["AI", "risk-tier", "GPAI"],
      },
      {
        id: "eu-edd",
        billCode: "Dir. 2023/1791",
        title: "Energy Efficiency Directive (recast)",
        summary:
          "Mandatory reporting and efficiency standards for data centers above 500 kW, including PUE disclosure and waste-heat reuse requirements.",
        stage: "Enacted",
        tags: ["data centers", "energy", "reporting"],
      },
    ],
    keyFigures: [
      {
        id: "eu-vestager",
        name: "Margrethe Vestager",
        role: "Former EVP, Digital Age",
        party: "ALDE",
        stance: "favorable",
        quote:
          "Trustworthy AI requires guardrails — not after harm is done, but before products reach the market.",
      },
      {
        id: "eu-breton",
        name: "Thierry Breton",
        role: "Former Commissioner, Internal Market",
        party: "Renaissance",
        stance: "favorable",
      },
    ],
    news: [
      {
        id: "eu-news-1",
        headline: "EU AI Office issues first guidance on general-purpose models",
        source: "Politico EU",
        date: "2026-03-12",
        url: "#",
      },
      {
        id: "eu-news-2",
        headline: "Member states diverge on data center reporting deadlines",
        source: "Euractiv",
        date: "2026-02-28",
        url: "#",
      },
    ],
  },
  {
    id: "germany",
    geoId: "276",
    name: "Germany",
    region: "eu",
    level: "federal",
    stance: "favorable",
    contextBlurb:
      "Germany is implementing the EU AI Act with additional national provisions on AI in employment and a binding data center efficiency law (EnEfG) requiring 100% renewable power for new facilities by 2027.",
    legislation: [
      {
        id: "de-enefg",
        billCode: "EnEfG §11",
        title: "Energy Efficiency Act — Data Centre Provisions",
        summary:
          "Requires PUE ≤ 1.2 for new data centers, 50% waste-heat reuse, and 100% renewable energy by 2027.",
        stage: "Enacted",
        tags: ["data centers", "PUE", "renewables"],
      },
      {
        id: "de-ai-employment",
        billCode: "Drs. 20/8129",
        title: "AI in Employment Act",
        summary:
          "Establishes works council co-determination rights over AI systems used in hiring, performance review, and dismissal decisions.",
        stage: "Floor",
        tags: ["AI", "employment"],
      },
    ],
    keyFigures: [
      {
        id: "de-wissing",
        name: "Volker Wissing",
        role: "Federal Minister for Digital and Transport · EnEfG sponsor",
        party: "FDP",
        stance: "favorable",
        quote:
          "Germany cannot lead on AI without first leading on data centre efficiency.",
      },
      {
        id: "de-mast",
        name: "Katja Mast",
        role: "MdB · SPD · Lead, AI in Employment Act",
        party: "SPD",
        stance: "favorable",
        quote:
          "Workers must have a seat at the table when AI decides who gets hired or fired.",
      },
      {
        id: "de-rasche",
        name: "Maria-Lena Weiss",
        role: "MdB · CDU · Digital Committee Ranking Member",
        party: "CDU",
        stance: "review",
      },
    ],
    news: [
      {
        id: "de-news-1",
        headline: "Frankfurt operators warn EnEfG renewables deadline is unworkable",
        source: "Handelsblatt",
        date: "2026-03-27",
        url: "#",
      },
      {
        id: "de-news-2",
        headline: "Bundestag committee advances AI co-determination bill",
        source: "Süddeutsche Zeitung",
        date: "2026-03-10",
        url: "#",
      },
    ],
  },
  {
    id: "france",
    geoId: "250",
    name: "France",
    region: "eu",
    level: "federal",
    stance: "review",
    contextBlurb:
      "France is positioning itself as the European AI capital while CNIL has flagged data center water consumption as an urgent regulatory gap. The government's AI sovereignty strategy emphasizes domestic compute capacity.",
    legislation: [
      {
        id: "fr-loi-num",
        billCode: "PJL-AN 2024-512",
        title: "Loi pour la Souveraineté Numérique",
        summary:
          "Establishes a national framework for sovereign cloud certification and data center siting near low-carbon power sources.",
        stage: "Committee",
        tags: ["sovereignty", "cloud"],
      },
      {
        id: "fr-cnil-water",
        billCode: "Arr. CNIL-2025",
        title: "CNIL Water Use Disclosure Order",
        summary:
          "Mandates water consumption disclosure for data centers exceeding 5 MW under expanded environmental reporting authority.",
        stage: "Enacted",
        tags: ["water", "CNIL"],
      },
    ],
    keyFigures: [
      {
        id: "fr-bothorel",
        name: "Éric Bothorel",
        role: "Deputy · Renaissance · Chair, AI Working Group",
        party: "Renaissance",
        stance: "favorable",
        quote:
          "Sovereignty is about controlling the stack — from chips to data to deployment.",
      },
      {
        id: "fr-de-montchalin",
        name: "Amélie de Montchalin",
        role: "Senator · Renaissance · Lead, Loi pour la Souveraineté Numérique",
        party: "Renaissance",
        stance: "favorable",
      },
      {
        id: "fr-bayou",
        name: "Julien Bayou",
        role: "Deputy · EELV · Water-use disclosure advocate",
        party: "EELV",
        stance: "restrictive",
        quote:
          "Marseille's data centres cannot drink the Rhône dry while families ration water.",
      },
    ],
    news: [
      {
        id: "fr-news-1",
        headline: "Marseille tech hub sees pushback over freshwater cooling",
        source: "Le Monde",
        date: "2026-03-22",
        url: "#",
      },
      {
        id: "fr-news-2",
        headline: "France earmarks €2.5B for sovereign AI compute under France 2030",
        source: "Les Echos",
        date: "2026-03-05",
        url: "#",
      },
    ],
  },
  {
    id: "united-kingdom",
    geoId: "826",
    name: "United Kingdom",
    region: "eu",
    level: "federal",
    stance: "review",
    // (key figures populated below)
    contextBlurb:
      "Post-Brexit, the UK has pursued a pro-innovation, principles-based AI approach distinct from the EU AI Act. Recent grid pressures from data center growth have prompted a National Grid load-zone review.",
    legislation: [
      {
        id: "uk-ai-bill",
        billCode: "HL Bill 11",
        title: "Artificial Intelligence (Regulation) Bill",
        summary:
          "Establishes a UK AI Authority with cross-sectoral coordination duties and a statutory duty to consult on high-risk model evaluations.",
        stage: "Committee",
        tags: ["AI", "regulator"],
      },
      {
        id: "uk-grid",
        billCode: "Ofgem CR-2025/04",
        title: "Data Centre Connection Code Review",
        summary:
          "Ofgem consultation on new connection queue rules for sub-50 MW data center loads following grid congestion in West London.",
        stage: "Filed",
        tags: ["Ofgem", "grid"],
      },
    ],
    keyFigures: [
      {
        id: "uk-clement-jones",
        name: "Lord Tim Clement-Jones",
        role: "Peer · Lib Dem · Lead, HL Bill 11",
        party: "Lib Dem",
        stance: "favorable",
        quote:
          "A principles-based UK approach still needs a regulator with statutory teeth.",
      },
      {
        id: "uk-onwurah",
        name: "Chi Onwurah",
        role: "MP · Labour · Shadow Minister, Science & Innovation",
        party: "Labour",
        stance: "review",
        quote:
          "Innovation that nobody trusts isn't innovation. The AI Authority must be properly empowered.",
      },
      {
        id: "uk-vaizey",
        name: "Lord Ed Vaizey",
        role: "Peer · Conservative · Communications and Digital Committee",
        party: "Conservative",
        stance: "concerning",
      },
    ],
    news: [
      {
        id: "uk-news-1",
        headline: "DSIT publishes pre-deployment evaluation framework",
        source: "Financial Times",
        date: "2026-03-28",
        url: "#",
      },
      {
        id: "uk-news-2",
        headline: "West London council blocks 200 MW data center expansion",
        source: "BBC News",
        date: "2026-03-13",
        url: "#",
      },
    ],
  },

  // ─────────── ASIA REGION ───────────
  {
    id: "asia-region",
    geoId: "asia-region",
    name: "Asia",
    region: "asia",
    level: "bloc",
    isOverview: true,
    stance: "review",
    contextBlurb:
      "AI governance across Asia varies widely. China maintains strict sovereign data requirements while Japan and South Korea pursue innovation-first frameworks with emerging environmental standards.",
    legislation: [
      {
        id: "asia-overview-1",
        billCode: "—",
        title: "Regional regulatory landscape",
        summary:
          "No pan-Asian AI framework exists. ASEAN issued non-binding guidance in 2024; APEC continues digital economy negotiations.",
        stage: "Filed",
        tags: ["regional", "ASEAN"],
      },
    ],
    keyFigures: [
      {
        id: "asia-koh",
        name: "Tan See Leng",
        role: "Singapore · Minister for Manpower & Trade",
        party: "PAP",
        stance: "favorable",
      },
      {
        id: "asia-lim",
        name: "Lim Joon Yong",
        role: "ASEAN Digital Working Group · Lead Negotiator",
        party: "—",
        stance: "review",
      },
    ],
    news: [
      {
        id: "asia-news-1",
        headline: "Japan METI updates voluntary AI guidelines for foundation models",
        source: "Nikkei Asia",
        date: "2026-03-22",
        url: "#",
      },
      {
        id: "asia-news-2",
        headline: "Singapore IMDA opens consultation on data center water use",
        source: "The Straits Times",
        date: "2026-03-04",
        url: "#",
      },
    ],
  },
  {
    id: "japan",
    geoId: "392",
    name: "Japan",
    region: "asia",
    level: "federal",
    stance: "favorable",
    contextBlurb:
      "Japan has pursued an innovation-first approach with voluntary AI guidelines from METI, while the FSA and METI jointly review data center grid integration as part of the GX (Green Transformation) initiative.",
    legislation: [
      {
        id: "jp-ai-guidelines",
        billCode: "METI 2024-G",
        title: "AI Business Operator Guidelines (revised)",
        summary:
          "Voluntary risk management framework for AI developers and deployers, aligned with international interoperability principles.",
        stage: "Enacted",
        tags: ["voluntary", "METI"],
      },
      {
        id: "jp-gx-dc",
        billCode: "Bill 213",
        title: "GX Data Centre Promotion Act",
        summary:
          "Provides tax incentives for data centers sited in regions with surplus renewable generation and grid capacity headroom.",
        stage: "Floor",
        tags: ["GX", "renewables"],
      },
    ],
    keyFigures: [
      {
        id: "jp-saito",
        name: "Ken Saito",
        role: "Minister of Economy, Trade and Industry · METI guidelines",
        party: "LDP",
        stance: "favorable",
        quote:
          "Voluntary frameworks let Japanese industry lead, not lag, on AI safety.",
      },
      {
        id: "jp-konishi",
        name: "Hiroyuki Konishi",
        role: "Diet Member · CDP · Lead, GX Data Centre Promotion Act",
        party: "CDP",
        stance: "favorable",
      },
      {
        id: "jp-yamada",
        name: "Taro Yamada",
        role: "Diet Member · LDP · Digital Society Committee",
        party: "LDP",
        stance: "review",
      },
    ],
    news: [
      {
        id: "jp-news-1",
        headline: "Hokkaido data center cluster wins GX designation",
        source: "Nikkei Asia",
        date: "2026-03-26",
        url: "#",
      },
      {
        id: "jp-news-2",
        headline: "JEITA publishes interoperability assessment for AI Act compliance",
        source: "The Japan Times",
        date: "2026-03-14",
        url: "#",
      },
    ],
  },
  {
    id: "china",
    geoId: "156",
    name: "China",
    region: "asia",
    level: "federal",
    stance: "restrictive",
    contextBlurb:
      "China maintains the world's most prescriptive AI regime, with mandatory security reviews for generative AI services, content labeling requirements, and aggressive data localization rules paired with significant state compute investment.",
    legislation: [
      {
        id: "cn-genai",
        billCode: "CAC 2023-07",
        title: "Interim Measures for Generative AI Services",
        summary:
          "Requires security assessments, content labeling, and licensed providers for public-facing generative AI services.",
        stage: "Enacted",
        tags: ["GenAI", "licensing"],
      },
      {
        id: "cn-east-data",
        billCode: "NDRC-2024-DC",
        title: "East Data West Compute Initiative — Phase II",
        summary:
          "National plan directing eastern data center workloads to renewable-rich western provinces, with mandatory PUE caps in eastern hubs.",
        stage: "Enacted",
        tags: ["EDWC", "PUE"],
      },
    ],
    keyFigures: [
      {
        id: "cn-zhuang",
        name: "Zhuang Rongwen",
        role: "Director · Cyberspace Administration of China",
        party: "CCP",
        stance: "restrictive",
        quote:
          "Generative AI must serve the socialist values of the people; security review is non-negotiable.",
      },
      {
        id: "cn-li",
        name: "Li Lecheng",
        role: "Vice Minister · MIIT · NDRC East Data West Compute lead",
        party: "CCP",
        stance: "restrictive",
      },
      {
        id: "cn-wang",
        name: "Wang Zhigang",
        role: "Former Minister of Science and Technology",
        party: "CCP",
        stance: "favorable",
      },
    ],
    news: [
      {
        id: "cn-news-1",
        headline: "CAC publishes second batch of approved generative AI services",
        source: "Caixin",
        date: "2026-03-29",
        url: "#",
      },
      {
        id: "cn-news-2",
        headline: "Inner Mongolia surpasses Beijing in installed AI compute",
        source: "South China Morning Post",
        date: "2026-03-08",
        url: "#",
      },
    ],
  },
  {
    id: "south-korea",
    geoId: "410",
    name: "South Korea",
    region: "asia",
    level: "federal",
    stance: "favorable",
    contextBlurb:
      "South Korea enacted its AI Basic Act in 2024 establishing a national framework, sandbox provisions, and a national AI safety institute. The Ministry of Trade is studying grid impacts of upcoming hyperscale projects.",
    legislation: [
      {
        id: "kr-ai-bf",
        billCode: "Bill 2206128",
        title: "AI Basic Act",
        summary:
          "Framework establishing high-impact AI categories, regulatory sandbox provisions, and a national AI safety institute.",
        stage: "Enacted",
        tags: ["framework", "AISI"],
      },
      {
        id: "kr-dc-grid",
        billCode: "MOTIE-2025-04",
        title: "Hyperscale Data Centre Grid Integration Act",
        summary:
          "Mandates grid impact assessments and curtailment agreements for data centers exceeding 200 MW.",
        stage: "Committee",
        tags: ["grid", "hyperscale"],
      },
    ],
    keyFigures: [
      {
        id: "kr-ahn",
        name: "Ahn Cheol-soo",
        role: "National Assembly Member · PPP · Lead, AI Basic Act",
        party: "PPP",
        stance: "favorable",
        quote:
          "Korea must build the safety institute the world will trust to evaluate frontier AI.",
      },
      {
        id: "kr-jo",
        name: "Jo Seoung-lae",
        role: "National Assembly Member · DPK · Lead, MOTIE-2025-04",
        party: "DPK",
        stance: "review",
      },
      {
        id: "kr-park",
        name: "Park Soo-young",
        role: "Minister of Science and ICT",
        party: "PPP",
        stance: "favorable",
      },
    ],
    news: [
      {
        id: "kr-news-1",
        headline: "Korea AI Safety Institute publishes evaluation methodology",
        source: "The Korea Herald",
        date: "2026-03-25",
        url: "#",
      },
      {
        id: "kr-news-2",
        headline: "Naver, Kakao announce joint compliance roadmap for AI Basic Act",
        source: "Yonhap News Agency",
        date: "2026-03-11",
        url: "#",
      },
    ],
  },
];

export function getEntity(geoId: string, region: Region): Entity | null {
  return ENTITIES.find((e) => e.geoId === geoId && e.region === region) ?? null;
}

export function getOverviewEntity(region: Region): Entity | null {
  return ENTITIES.find((e) => e.region === region && e.isOverview) ?? null;
}

export function getEntitiesByRegion(region: Region): Entity[] {
  return ENTITIES.filter((e) => e.region === region);
}
