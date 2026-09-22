import "temporal-polyfill/global";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import {
  createViewMonthAgenda,
  createViewMonthGrid,
  viewMonthGrid,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import "@schedule-x/theme-default/dist/index.css";
import {
  displayTitle,
  eventKind,
  formatEventClocks,
  formatMonthLabel,
  formatWeekRangeLabel,
  getMondayWeek,
  getStockholmMonth,
  parseEventsInRange,
  shiftStockholmDays,
  temporalToDate,
  toScheduleXEvents,
} from "../../lib/today";
import { stockholmDateKey } from "../../lib/highlights";
import { CALENDAR_SUBSCRIBE_URL } from "../../site";

const KIND_LABEL = {
  bachata: "Bachata",
  salsa: "Salsa",
  kizomba: "Kizomba",
  zouk: "Zouk",
};

const calendars = {
  bachata: {
    colorName: "bachata",
    lightColors: {
      main: "#c2410c",
      container: "#ffedd5",
      onContainer: "#7c2d12",
    },
  },
  salsa: {
    colorName: "salsa",
    lightColors: {
      main: "#e11d48",
      container: "#ffe4e6",
      onContainer: "#9f1239",
    },
  },
  kizomba: {
    colorName: "kizomba",
    lightColors: {
      main: "#7c3aed",
      container: "#f3e8ff",
      onContainer: "#5b21b6",
    },
  },
  zouk: {
    colorName: "zouk",
    lightColors: {
      main: "#2563eb",
      container: "#dbeafe",
      onContainer: "#1e40af",
    },
  },
  other: {
    colorName: "other",
    lightColors: {
      main: "#0f2f44",
      container: "#e8eef2",
      onContainer: "#0f2f44",
    },
  },
};

function clocksFor(active) {
  if (!active) {
    return null;
  }
  if (typeof active.start?.hour === "number") {
    return {
      start: `${String(active.start.hour).padStart(2, "0")}:${String(active.start.minute).padStart(2, "0")}`,
      end:
        typeof active.end?.hour === "number"
          ? `${String(active.end.hour).padStart(2, "0")}:${String(active.end.minute).padStart(2, "0")}`
          : "",
    };
  }
  return formatEventClocks(active);
}

function MonthGrid({ ics, onEventClick, onMonthLabel }) {
  const icsRef = useRef(ics);
  icsRef.current = ics;
  const eventsService = useState(() => createEventsServicePlugin())[0];

  const calendar = useCalendarApp(
    {
      views: [createViewMonthGrid(), createViewMonthAgenda()],
      defaultView: viewMonthGrid.name,
      locale: "en-GB",
      timezone: "Europe/Stockholm",
      firstDayOfWeek: 1,
      calendars,
      events: [],
      callbacks: {
        onRangeUpdate(range) {
          const start = temporalToDate(range.start);
          onMonthLabel(
            formatMonthLabel(new Date(start.getTime() + 10 * 86400000)),
          );
          if (!icsRef.current) {
            return;
          }
          eventsService.set(
            toScheduleXEvents(
              parseEventsInRange(
                icsRef.current,
                start,
                temporalToDate(range.end),
              ),
            ),
          );
        },
        onEventClick(calendarEvent) {
          onEventClick(calendarEvent);
        },
      },
    },
    [eventsService],
  );

  useEffect(() => {
    if (!calendar || !ics) {
      return;
    }
    const month = getStockholmMonth();
    eventsService.set(
      toScheduleXEvents(
        parseEventsInRange(ics, month[0].start, month[month.length - 1].end),
      ),
    );
  }, [calendar, eventsService, ics]);

  return calendar ? <ScheduleXCalendar calendarApp={calendar} /> : null;
}

function CalendarSection() {
  const dialogRef = useRef(null);
  const titleId = useId();
  const icsRef = useRef("");
  const [status, setStatus] = useState("loading");
  const [active, setActive] = useState(null);
  const [anchor, setAnchor] = useState(() => new Date());
  const [span, setSpan] = useState("week");
  const [icsVersion, setIcsVersion] = useState(0);
  const [monthLabel, setMonthLabel] = useState(() => formatMonthLabel());

  const days = useMemo(() => getMondayWeek(anchor), [anchor]);
  const todayKey = stockholmDateKey();

  const eventsByDay = useMemo(() => {
    const ics = icsRef.current;
    const grouped = Object.fromEntries(days.map((day) => [day.key, []]));
    if (!ics) {
      return grouped;
    }

    const weekEvents = parseEventsInRange(ics, days[0].start, days[6].end);
    for (const event of weekEvents) {
      const key = stockholmDateKey(new Date(event.start));
      if (grouped[key]) {
        grouped[key].push(event);
      }
    }
    return grouped;
  }, [days, icsVersion]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/calendar.ics")
      .then((response) => {
        if (!response.ok) {
          throw new Error("feed");
        }
        return response.text();
      })
      .then((ics) => {
        if (cancelled) {
          return;
        }
        icsRef.current = ics;
        setIcsVersion((value) => value + 1);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (active) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [active]);

  const clocks = clocksFor(active);
  const kind = active
    ? active.calendarId && active.calendarId !== "other"
      ? active.calendarId
      : eventKind(active.title || active.rawTitle || "")
    : null;

  const thisWeekKey = getMondayWeek(new Date())[0].key;
  const viewingThisWeek = span === "week" && days[0].key === thisWeekKey;
  const viewingNextWeek = span === "week" && !viewingThisWeek;
  const viewingMonth = span === "month";

  return (
    <section className="calendar-part" id="week">
      <div className="title text-center">
        <p>Stockholm time · week starts Monday</p>
        <h1>{span === "month" ? "This month on the floor" : "This week on the floor"}</h1>
      </div>
      <div className="container">
        {status === "error" ? (
          <p className="today-status">Could not load the week view from the calendar feed.</p>
        ) : (
          <div
            className={
              span === "month"
                ? "calendar-frame sx-month-frame"
                : "calendar-frame week-rows-frame"
            }
          >
            <div className="week-rows-toolbar">
              <p className="week-rows-label">
                {span === "month" ? monthLabel : formatWeekRangeLabel(days)}
              </p>
              <div className="week-rows-toolbar-end" role="group" aria-label="Calendar filters">
                <button
                  type="button"
                  className={
                    viewingThisWeek ? "week-rows-nav is-active" : "week-rows-nav"
                  }
                  aria-pressed={viewingThisWeek}
                  onClick={() => {
                    setSpan("week");
                    setAnchor(new Date());
                  }}
                >
                  This week
                </button>
                <button
                  type="button"
                  className={
                    viewingNextWeek ? "week-rows-nav is-active" : "week-rows-nav"
                  }
                  aria-pressed={viewingNextWeek}
                  onClick={() => {
                    setSpan("week");
                    setAnchor((current) =>
                      shiftStockholmDays(span === "month" ? new Date() : current, 7),
                    );
                  }}
                >
                  Next week
                </button>
                <button
                  type="button"
                  className={
                    viewingMonth ? "week-rows-nav is-active" : "week-rows-nav"
                  }
                  aria-pressed={viewingMonth}
                  onClick={() => {
                    setSpan("month");
                    setAnchor(new Date());
                    setMonthLabel(formatMonthLabel());
                  }}
                >
                  This month
                </button>
              </div>
            </div>
            {span === "month" ? (
              <MonthGrid
                ics={icsRef.current}
                onEventClick={setActive}
                onMonthLabel={setMonthLabel}
              />
            ) : (
              <ol className="week-rows">
                {days.map((day) => {
                  const events = eventsByDay[day.key] || [];
                  return (
                    <li
                      key={day.key}
                      className={day.key === todayKey ? "week-row is-today" : "week-row"}
                    >
                      <div className="week-row-day">
                        <span className="week-row-weekday">{day.weekday}</span>
                        <span className="week-row-date">{day.day}</span>
                      </div>
                      <div className="week-row-events">
                        {events.length === 0 ? (
                          <p className="week-row-empty">Quiet night</p>
                        ) : (
                          events.map((event) => {
                            const eventKindName = eventKind(event.title);
                            const eventClocks = formatEventClocks(event);
                            return (
                              <button
                                key={event.id}
                                type="button"
                                className={`week-event week-event-${eventKindName || "other"}`}
                                onClick={() => setActive(event)}
                              >
                                <span className="week-event-time">
                                  {eventClocks.end
                                    ? `${eventClocks.start}–${eventClocks.end}`
                                    : eventClocks.start}
                                </span>
                                <span className="week-event-title">
                                  {displayTitle(event.title)}
                                </span>
                                {event.location ? (
                                  <span className="week-event-venue">{event.location}</span>
                                ) : null}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}
        <p className="calendar-subscribe">
          <a href={CALENDAR_SUBSCRIBE_URL} target="_blank" rel="noreferrer">
            Add to Google Calendar
          </a>
        </p>
      </div>

      <dialog
        ref={dialogRef}
        className="highlight-dialog"
        aria-labelledby={titleId}
        onClose={() => setActive(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
      >
        {active ? (
          <>
            <div className="highlight-dialog-head">
              <p className="highlight-meta">
                <time dateTime={String(active.start || "")}>
                  {clocks.end ? `${clocks.start}–${clocks.end}` : clocks.start}
                </time>
                {kind ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>{KIND_LABEL[kind]}</span>
                  </>
                ) : null}
              </p>
              <h3 id={titleId}>{displayTitle(active.title || "")}</h3>
            </div>
            <div className="highlight-dialog-body">
              {active.location ? <p className="highlight-venue">{active.location}</p> : null}
              {active.priceLabel ? <p className="today-price">{active.priceLabel}</p> : null}
              <p className="highlight-description">
                {active.description || "No extra details in the calendar entry yet."}
              </p>
            </div>
            <div className="highlight-dialog-foot">
              {active.sourceUrl ? (
                <a href={active.sourceUrl} target="_blank" rel="noreferrer">
                  Open source link
                </a>
              ) : null}
              <button type="button" onClick={() => dialogRef.current?.close()}>
                Close
              </button>
            </div>
          </>
        ) : null}
      </dialog>
    </section>
  );
}

export default CalendarSection;
