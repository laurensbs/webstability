/**
 * Inline JSON-LD script tag for structured data. Drop into a server
 * component; the JSON is serialized at render time and inlined into
 * the HTML payload — Google parses it without an extra request.
 *
 * Usage:
 *   <JsonLd data={{ "@context": "https://schema.org", ... }} />
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
