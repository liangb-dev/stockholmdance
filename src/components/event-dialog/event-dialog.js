import React from "react";
import { descriptionPrice, layoutDescription, sourceHost } from "../../lib/event-details";

function RichText({ text }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, index) => {
    if (!/^https?:\/\//.test(part)) {
      return <React.Fragment key={index}>{part}</React.Fragment>;
    }
    const href = part.replace(/[.,);]+$/, "");
    return (
      <a key={index} href={href} target="_blank" rel="noreferrer">
        {href.replace(/^https?:\/\//, "")}
      </a>
    );
  });
}

function Schedule({ blocks }) {
  return blocks.map((block, index) => {
    if (block.type === "slot") {
      return (
        <li key={index} className="event-slot">
          <time>{block.time}</time>
          <span>{block.label}</span>
        </li>
      );
    }
    if (block.type === "subhead") {
      return (
        <li key={index} className="event-subhead">
          {block.text}
        </li>
      );
    }
    return (
      <li key={index} className="event-note">
        <RichText text={block.text} />
      </li>
    );
  });
}

function DescriptionBody({ description }) {
  const layout = layoutDescription(description);
  const hasContent = layout.intro.length > 0 || layout.sections.length > 0;
  if (!hasContent) {
    return <p className="event-prose">No extra details in the calendar entry yet.</p>;
  }

  const framed = layout.sections.length > 1 || layout.sections.some((section) => section.heading);
  const prose = layout.intro.map((text) => (
    <p key={text} className="event-prose">
      <RichText text={text} />
    </p>
  ));

  if (!framed) {
    const blocks = layout.sections[0]?.blocks || [];
    const lead = [];
    const rest = [];
    let started = false;
    for (const block of blocks) {
      if (!started && block.type === "text") {
        lead.push(block);
      } else {
        started = true;
        rest.push(block);
      }
    }

    return (
      <>
        {prose}
        {lead.map((block) => (
          <p key={block.text} className="event-prose">
            <RichText text={block.text} />
          </p>
        ))}
        {rest.length > 0 ? (
          <ul className="event-schedule">
            <Schedule blocks={rest} />
          </ul>
        ) : null}
      </>
    );
  }

  return (
    <>
      {prose}
      {layout.sections.map((section) => (
          <section key={`${section.heading}-${section.place}`} className="event-day">
            {section.heading || section.place ? (
              <header className="event-day-title">
                {section.heading ? <strong>{section.heading}</strong> : <span />}
                {section.place ? <span className="event-day-place">{section.place}</span> : null}
              </header>
            ) : null}
            <ul className="event-schedule">
              <Schedule blocks={section.blocks} />
            </ul>
          </section>
        ))}
    </>
  );
}

function EventDialog({
  dialogRef,
  titleId,
  onClose,
  title,
  kindLabel,
  tone,
  when,
  where,
  price,
  ongoing,
  description,
  sourceUrl,
}) {
  const priceLabel = price || descriptionPrice(description || "");
  const facts = [
    where ? { label: "Where", value: where } : null,
    priceLabel ? { label: "Price", value: priceLabel } : null,
  ].filter(Boolean);
  const host = sourceUrl ? sourceHost(sourceUrl) : "";

  return (
    <dialog
      ref={dialogRef}
      className="highlight-dialog"
      aria-labelledby={title ? titleId : undefined}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          event.currentTarget.close();
        }
      }}
    >
      {title ? (
        <>
          <div className="highlight-dialog-head">
            <button
              type="button"
              className="event-dialog-x"
              aria-label="Close"
              onClick={() => dialogRef.current?.close()}
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path
                  d="M3.2 3.2l9.6 9.6M12.8 3.2L3.2 12.8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <p className="highlight-meta">
              {kindLabel ? (
                <span className={tone ? `event-kind event-kind-${tone}` : "event-kind"}>
                  {kindLabel}
                </span>
              ) : null}
              {when ? <time>{when}</time> : null}
              {ongoing ? (
                <span className="highlight-ongoing">
                  <span className="highlight-ongoing-dot" />
                  Ongoing
                </span>
              ) : null}
            </p>
            <h3 id={titleId}>{title}</h3>
          </div>
          {facts.length > 0 ? (
            <dl className="event-facts">
              {facts.map((fact) => (
                <div key={fact.label} className="event-fact">
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <div className="highlight-dialog-body">
            <DescriptionBody description={description} />
          </div>
          <div className="highlight-dialog-foot">
            {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noreferrer">
                {host ? `Visit ${host}` : "Open source"}
              </a>
            ) : (
              <span />
            )}
            <button type="button" onClick={() => dialogRef.current?.close()}>
              Close
            </button>
          </div>
        </>
      ) : null}
    </dialog>
  );
}

export default EventDialog;
