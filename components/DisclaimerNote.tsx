import { FEEDBACK_EMAIL } from "@/lib/site";

export function DisclaimerNote() {
  return (
    <aside className="border-b border-border bg-surface/80 px-4 py-3 text-sm leading-relaxed text-muted sm:px-6 lg:px-8">
      <p className="mx-auto max-w-[1180px]">
        <span className="mr-2 font-semibold tracking-[0.12em] text-gold uppercase">
          Note
        </span>
        I use Claude to help manage my calendar so please double-check event
        official pages (time, price, dress code) before heading out. Use this
        calendar predominantly as a reference. Spotted
        something wrong or missing?{" "}
        <a
          className="font-medium text-foreground underline underline-offset-2 hover:text-accent"
          href={`mailto:${FEEDBACK_EMAIL}`}
        >
          Let me know
        </a>
        .
      </p>
    </aside>
  );
}
