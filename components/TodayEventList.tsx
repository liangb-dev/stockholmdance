import {
  eventStatus,
  formatEventTime,
  type TodayEvent,
} from "@/lib/event-display";

export function TodayEventList({ events }: { events: TodayEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="mt-3 text-[0.95rem] text-muted">No events listed for today.</p>
    );
  }

  return (
    <ul className="mt-3 divide-y divide-border">
      {events.map((event) => {
        const status = eventStatus(event);

        return (
          <li
            key={event.id}
            className={`flex items-baseline gap-3 py-2.5 sm:gap-4 ${status === "past" ? "opacity-55" : ""}`}
          >
            <time
              className="w-[7.25rem] shrink-0 tabular-nums text-[0.95rem] text-muted"
              dateTime={event.start}
            >
              {formatEventTime(event)}
            </time>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{event.title}</p>
              {event.location ? (
                <p className="truncate text-[0.9rem] text-muted">{event.location}</p>
              ) : null}
            </div>
            <span className="w-[4.4rem] shrink-0 text-right text-[0.8rem] text-muted">
              {event.isRecurring ? "Repeats" : "Once"}
            </span>
            {status === "now" ? (
              <span className="w-8 shrink-0 text-right text-[0.75rem] font-semibold uppercase tracking-wide text-accent">
                Now
              </span>
            ) : (
              <span className="hidden w-8 shrink-0 sm:block" />
            )}
          </li>
        );
      })}
    </ul>
  );
}
