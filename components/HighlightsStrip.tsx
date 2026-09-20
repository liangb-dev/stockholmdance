import { connection } from "next/server";
import { HighlightsGallery } from "@/components/HighlightsGallery";
import { getHighlights } from "@/lib/events";
import type { Highlight } from "@/lib/highlights";

export async function HighlightsStrip() {
  await connection();

  let items: Highlight[] = [];

  try {
    items = await getHighlights();
  } catch {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      id="highlights"
      className="mt-14 border-t border-border/80 pt-10 sm:mt-16 sm:pt-12"
      aria-labelledby="highlights-heading"
    >
      <div className="max-w-2xl">
        <h2
          id="highlights-heading"
          className="font-display text-[1.65rem] leading-none tracking-tight"
        >
          Weekends &amp; festivals
        </h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
          Upcoming and ongoing from the calendar — festivals, weekends, and
          cruises.
        </p>
      </div>

      <HighlightsGallery items={items} />
    </section>
  );
}
