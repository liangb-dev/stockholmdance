import { CALENDAR_EMBED_URL, SITE_NAME } from "@/lib/site";

export function CalendarEmbed() {
  return (
    <section
      id="week"
      className="lg:sticky lg:top-8"
      aria-labelledby="week-heading"
    >
      <div className="mb-3">
        <h2
          id="week-heading"
          className="font-display text-[1.65rem] leading-none tracking-tight"
        >
          This week
        </h2>
        <p className="mt-1 text-sm text-muted">Stockholm time · week starts Monday</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_18px_50px_-28px_rgba(28,20,16,0.45)]">
        <iframe
          title={`${SITE_NAME} calendar`}
          src={CALENDAR_EMBED_URL}
          className="h-[min(72vh,820px)] min-h-[420px] w-full border-0 sm:min-h-[560px]"
        />
      </div>
    </section>
  );
}
