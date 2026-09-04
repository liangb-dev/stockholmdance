import { Logo } from "@/components/Logo";
import {
  CALENDAR_SUBSCRIBE_URL,
  DANCE_STYLES,
  FEEDBACK_EMAIL,
  SITE_NAME,
} from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface/70 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <p className="font-display text-[1.15rem] leading-none tracking-tight">
              {SITE_NAME}
            </p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {DANCE_STYLES.join(" · ")} across Stockholm, in one public calendar.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          <a
            className="font-medium text-foreground underline-offset-2 hover:text-accent hover:underline"
            href={CALENDAR_SUBSCRIBE_URL}
          >
            Subscribe to the calendar
          </a>
          <a
            className="font-medium text-foreground underline-offset-2 hover:text-accent hover:underline"
            href={`mailto:${FEEDBACK_EMAIL}`}
          >
            Contact me
          </a>
          <p className="mt-2 text-muted">© {year} {SITE_NAME}</p>
        </nav>
      </div>
    </footer>
  );
}
