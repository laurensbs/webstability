// AI-conceptgenerator voor blog-posts. Roept de Anthropic Messages API
// rechtstreeks aan via fetch (geen SDK-dependency — past bij de andere
// fetch-based integraties in dit project). De system-prompt codeert de
// huisstijl: lengte, frontmatter, één H1, H2's met zoekwoord, interne
// links, en de Laurens-toon (geen marketing-fluff, eerlijk, concreet).
//
// Output is een volledig MDX-bestand (frontmatter + body) als string —
// klaar om als `content/blog/nl/[slug].mdx` te plaatsen. De generator
// publiceert niets zelf; dat doet de cron via een mail naar Laurens.

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-7";
const MAX_TOKENS = 8000;

export type GenerateInput = {
  slug: string;
  title: string;
  targetKeywords: string;
  brief: string;
};

export type GenerateResult = {
  bodyMdx: string;
  model: string;
};

const SYSTEM_PROMPT = `Je bent de vaste blog-schrijver van Webstability — een Nederlands/Spaans webbureau (één persoon: Laurens Bos, vanuit Begur aan de Costa Brava) gespecialiseerd in verhuursoftware op maat en MKB-maatwerksoftware. Je schrijft een volledige blog-post in het Nederlands als MDX-bestand.

POSITIONERING (verwerk dit impliciet, niet als reclame-blok):
- Eén systeem in plaats van vijf losse tools (agenda + facturentool + Drive + WhatsApp + spreadsheet).
- Eén persoon die blijft — direct contact, vaste prijs, vier weken, de code is van jou.
- Het is van jou, in twee talen — NL én ES als gelijkwaardige rails (contract, portaal, mails, facturen met BTW én IVA).
- Prijzen: maatwerk-build €5.000–8.000 vaste prijs / 4 weken (groter geheel publieke site + admin + portaal: €6.000–10.000); daarna abonnement vanaf €99/maand voor hosting, monitoring, onderhoud en doorbouwen. Discovery-traject €500–750. Geen uurtje-factuurtje.

TOON:
- Eerlijk en nuchter. Geen marketing-fluff, geen "in de snelle wereld van vandaag", geen superlatieven-stapeling, geen emoji.
- Premium-maar-persoonlijk: het mag klinken als iemand die het vak verstaat en je een eerlijk antwoord geeft, niet als een sales-deck.
- Concreet: cijfers, voorbeelden, namen van echte tools (Booqable, Tommy, Avantio, Lodgify, Icnea, Holded, e-Boekhouden, Stripe, Mollie). Geen verzonnen cijfers of cases.
- Altijd een eerlijke "wanneer wel / wanneer niet"-sectie — durf te zeggen dat de lezer beter bij een SaaS-tool blijft als dat zo is.

STRUCTUUR (verplicht):
- 1000–1500 woorden.
- Begin met YAML-frontmatter tussen \`---\` regels, met exact deze velden:
  title: "..." (één H1-waardige titel; mag de werktitel aanscherpen maar blijft on-topic en bevat een primair zoekwoord)
  description: "..." (1–2 zinnen, ~150–300 tekens, met de belangrijkste zoekwoorden, geschikt als meta-description)
  date: <datum die ik je geef, in YYYY-MM-DD>
  author: Laurens Bos
  keywords:
    - <5 zoekwoorden, één per regel met "- " ervoor — bevat de target-keywords>
  tags:
    - <2–4 topic-tags, kebab-case, bv. verhuursoftware / vergelijking / gids>
- Daarna de body in Markdown. GEEN tweede H1 (\`#\`) — de titel in de frontmatter is de H1. Gebruik \`##\` voor secties, met een zoekwoord in de kop waar natuurlijk. \`###\` voor subsecties mag.
- Open met een concrete, herkenbare scène of vraag (geen "In dit artikel bespreken we…").
- Minstens 2 interne links als gewone Markdown-links naar paden die ik in de briefing noem (bv. [tekst](/diensten/verhuur-boekingssysteem)). Gebruik ALLEEN paden die expliciet in de briefing staan — verzin geen URLs.
- Eindig met een korte CTA-alinea: nodig uit om te mailen via [link](/contact) met de belofte "binnen een dag een eerlijk antwoord, geen pitch-deck", plus een link naar een relevante service- of blog-pagina uit de briefing.

OUTPUT: geef ALLEEN het MDX-bestand terug — beginnend met \`---\` (de frontmatter), eindigend met de laatste regel van de body. Geen uitleg ervoor of erna, geen markdown-codeblok-fences eromheen.`;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Verwijdert per ongeluk meegegeven ```-fences en leidende pr-/post-uitleg. */
function cleanMdx(raw: string): string {
  let s = raw.trim();
  // Strip een omsluitend codeblok als het model dat toch toevoegde.
  const fence = s.match(/^```(?:mdx|markdown)?\s*\n([\s\S]*?)\n```$/);
  if (fence) s = fence[1].trim();
  // Body moet met de frontmatter beginnen.
  const fmStart = s.indexOf("---");
  if (fmStart > 0) s = s.slice(fmStart).trim();
  return s + "\n";
}

export async function generateBlogDraft(input: GenerateInput): Promise<GenerateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const userPrompt = [
    `Onderwerp / werktitel: ${input.title}`,
    `Slug (bestandsnaam): ${input.slug}`,
    `Primaire zoekwoorden: ${input.targetKeywords}`,
    `Datum voor de frontmatter: ${todayISO()}`,
    ``,
    `Briefing (hoek, wat te benadrukken, welke interne links — gebruik UITSLUITEND de paden die hier staan):`,
    input.brief,
  ].join("\n");

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
    model?: string;
  };
  const text = (data.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("");
  if (!text.trim()) throw new Error("Anthropic API returned empty content");

  return { bodyMdx: cleanMdx(text), model: data.model ?? MODEL };
}
