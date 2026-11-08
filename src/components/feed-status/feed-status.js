import React, { useRef } from "react";

const COPY = {
  loading: "Loading the calendar feed…",
  error: "The calendar feed didn't load, so this isn't an empty schedule.",
  aged: "This is an earlier copy of the calendar feed, not a freshly loaded schedule.",
  unavailable:
    "The calendar feed didn't refresh. This is the last copy that loaded, not a new result.",
};

function FeedStatus({
  notice,
  reason,
  refreshing = false,
  onRetry,
  headingId,
  retryLabel = "Try loading the calendar feed again",
  alert = false,
}) {
  const buttonRef = useRef(null);

  if (!notice) {
    return null;
  }

  const message = notice === "stale" ? COPY[reason] || COPY.unavailable : COPY[notice];
  const isError = notice === "error";

  async function handleRetry() {
    const result = await onRetry?.();
    if (!result) {
      return;
    }
    requestAnimationFrame(() => {
      if (result.status === "error") {
        buttonRef.current?.focus();
        return;
      }
      if (headingId) {
        document.getElementById(headingId)?.focus();
      }
    });
  }

  return (
    <div
      className={notice === "stale" ? "feed-status feed-status-stale" : "feed-status"}
      role={alert && isError ? "alert" : "status"}
      aria-live={alert ? "polite" : "off"}
    >
      <p>{message}</p>
      {notice === "loading" ? null : (
        <button
          ref={buttonRef}
          type="button"
          onClick={handleRetry}
          disabled={refreshing}
          aria-label={retryLabel}
        >
          {refreshing ? "Trying again…" : "Try again"}
        </button>
      )}
    </div>
  );
}

export default FeedStatus;
