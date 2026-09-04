import { CalendarEmbed } from "@/components/CalendarEmbed";
import { DisclaimerNote } from "@/components/DisclaimerNote";
import { SubscribeButton } from "@/components/SubscribeButton";
import { TodaySummary } from "@/components/TodaySummary";
import { SITE_DESCRIPTION, SITE_KICKER, SITE_NAME } from "@/lib/site";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[1440px]">
      <p className="mb-2 text-[0.8rem] font-semibold tracking-[0.14em] text-accent uppercase">
        {SITE_KICKER}
      </p>
      <h1 className="mb-3 text-[2.15rem] font-semibold leading-[1.15] tracking-tight sm:text-[2.45rem]">
        {SITE_NAME}
      </h1>
      <p className="max-w-[34rem] text-[1.08rem] leading-relaxed text-muted">
        {SITE_DESCRIPTION}
      </p>
      <TodaySummary />
      <CalendarEmbed />
      <SubscribeButton />
      <DisclaimerNote />
    </main>
  );
}
