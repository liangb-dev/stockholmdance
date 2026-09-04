import { CALENDAR_EMBED_URL, SITE_NAME } from "@/lib/site";

export function CalendarEmbed() {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
      <iframe
        title={`${SITE_NAME} calendar`}
        src={CALENDAR_EMBED_URL}
        className="h-[min(85vh,900px)] min-h-[640px] w-full border-0"
      />
    </div>
  );
}
