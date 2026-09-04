import { CONTACT_EMAIL } from "@/lib/site";

export function DisclaimerNote() {
  return (
    <footer className="mt-12 border-t border-border pt-6 text-sm leading-relaxed text-muted lg:mt-16">
      I try to keep this accurate, but please double-check event details (time,
      price, dress code) before heading out — organizers change things. Spotted
      something wrong or missing? Let me know at{" "}
      <a
        className="font-medium text-foreground underline-offset-2 hover:text-accent hover:underline"
        href={`mailto:${CONTACT_EMAIL}`}
      >
        {CONTACT_EMAIL}
      </a>
      .
    </footer>
  );
}
