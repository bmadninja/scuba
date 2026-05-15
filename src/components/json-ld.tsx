// Renders schema.org JSON-LD safely. Server component.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify is XSS-safe when the input is a plain object built
      // by our schema-org helpers — no user input flows in directly.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
