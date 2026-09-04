import { CONTACT_EMAIL } from "@/lib/site";

export function DisclaimerNote() {
  return (
    <div className="mt-8 rounded-r-lg border-l-[3px] border-accent bg-accent-wash px-5 py-5 text-[0.95rem] leading-relaxed">
      I try to keep this accurate, but please double-check event details (time,
      price, dress code) before heading out — organizers change things. Spotted
      something wrong or missing? Let me know at{" "}
      <a className="text-accent underline-offset-2 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
        {CONTACT_EMAIL}
      </a>
      .
    </div>
  );
}
