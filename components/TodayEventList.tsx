import {
  eventKind,
  eventStatus,
  formatEventClocks,
  type DanceKind,
  type TodayEvent,
  type TodayEventStatus,
} from "@/lib/event-display";

const KIND_LABEL: Record<DanceKind, string> = {
  bachata: "Bachata",
  salsa: "Salsa",
  kizomba: "Kizomba",
  zouk: "Zouk",
};

const KIND_CLASS: Record<DanceKind, string> = {
  bachata: "text-kind-bachata bg-kind-bachata/10",
  salsa: "text-kind-salsa bg-kind-salsa/10",
  kizomba: "text-kind-kizomba bg-kind-kizomba/10",
  zouk: "text-kind-zouk bg-kind-zouk/10",
};

const KIND_BAR: Record<DanceKind, string> = {
  bachata: "bg-kind-bachata",
  salsa: "bg-kind-salsa",
  kizomba: "bg-kind-kizomba",
  zouk: "bg-kind-zouk",
};

function EventRow({ event }: { event: TodayEvent }) {
  const status = eventStatus(event);
  const clocks = formatEventClocks(event);
  const kind = eventKind(event.title);
  const titleClass =
    "min-w-0 flex-1 text-[0.98rem] leading-snug font-medium break-words";

  return (
    <li
      className={`relative flex gap-3 py-4 pl-3 ${status === "past" ? "opacity-50" : ""}`}
    >
      <span
        className={`absolute top-4 bottom-4 left-0 w-[3px] rounded-full ${
          status === "now"
            ? "bg-accent"
            : kind
              ? KIND_BAR[kind]
              : "bg-border"
        }`}
      />
      <time
        className="w-[3.15rem] shrink-0 pt-0.5 tabular-nums"
        dateTime={event.start}
      >
        <span className="block text-[0.95rem] font-semibold leading-tight">
          {clocks.start}
        </span>
        {clocks.end ? (
          <span className="mt-0.5 block text-[0.75rem] leading-tight text-muted">
            {clocks.end}
          </span>
        ) : null}
      </time>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          {event.sourceUrl ? (
            <a
              href={event.sourceUrl}
              className={`${titleClass} text-foreground underline-offset-2 hover:text-accent hover:underline`}
              target="_blank"
              rel="noreferrer"
            >
              {event.title}
            </a>
          ) : (
            <p className={titleClass}>{event.title}</p>
          )}
          {status === "now" ? (
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-wash px-2 py-0.5 text-[0.68rem] font-bold tracking-wide text-accent uppercase">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              Now
            </span>
          ) : null}
        </div>

        {event.phases.length > 0 ? (
          <p className="mt-1.5 text-[0.82rem] leading-snug text-muted">
            {event.phases.map((phase, index) => (
              <span key={`${phase.label}-${phase.time}`}>
                {index > 0 ? <span className="text-border"> · </span> : null}
                <span className="font-medium text-foreground/80">{phase.label}</span>
                <span> {phase.time}</span>
              </span>
            ))}
          </p>
        ) : null}

        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.85rem] break-words text-muted">
          {event.location ? <span>{event.location}</span> : null}
          {event.priceLabel ? (
            <span className="font-medium text-gold">{event.priceLabel}</span>
          ) : null}
          {kind ? (
            <span
              className={`rounded-full px-1.5 py-px text-[0.68rem] font-semibold tracking-wide uppercase ${KIND_CLASS[kind]}`}
            >
              {KIND_LABEL[kind]}
            </span>
          ) : null}
          {event.isRecurring ? <span>Weekly</span> : null}
        </p>
      </div>
    </li>
  );
}

function EventGroup({
  title,
  events,
}: {
  title: string;
  events: TodayEvent[];
}) {
  if (events.length === 0) {
    return null;
  }

  return (
    <li className="[&:first-child>h3]:pt-2">
      <h3 className="pt-5 pb-1 text-[0.72rem] font-semibold tracking-[0.14em] text-gold uppercase">
        {title}
      </h3>
      <ul className="divide-y divide-border/80">
        {events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </ul>
    </li>
  );
}

export function TodayEventList({ events }: { events: TodayEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">
        Quiet floor tonight. Check the week view, or add the calendar so the
        next social doesn’t sneak by.
      </p>
    );
  }

  const grouped: Record<TodayEventStatus, TodayEvent[]> = {
    now: [],
    upcoming: [],
    past: [],
  };

  for (const event of events) {
    grouped[eventStatus(event)].push(event);
  }

  return (
    <ul className="mt-1">
      <EventGroup title="Happening now" events={grouped.now} />
      <EventGroup title="Coming up" events={grouped.upcoming} />
      <EventGroup title="Earlier today" events={grouped.past} />
    </ul>
  );
}
