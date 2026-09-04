import { CalendarEmbed } from "@/components/CalendarEmbed";
import { Logo } from "@/components/Logo";
import { SubscribeButton } from "@/components/SubscribeButton";
import { TodaySummary } from "@/components/TodaySummary";
import {
  DANCE_STYLES,
  SITE_DESCRIPTION,
  SITE_KICKER,
} from "@/lib/site";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(17rem,23.5rem)_minmax(0,1fr)] lg:gap-14">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <Logo className="h-8 w-8" />
            <p className="text-[0.78rem] font-semibold tracking-[0.16em] text-accent uppercase">
              {SITE_KICKER}
            </p>
          </div>

          <h1 className="font-display mt-5 text-[2.7rem] leading-[1.04] tracking-[-0.03em] text-balance sm:text-[3.2rem]">
            Stockholm
            <span className="mt-1 block italic text-accent">Bachata & Salsa</span>
          </h1>

          <p className="mt-4 max-w-[28rem] text-[1.05rem] leading-relaxed text-muted">
            {SITE_DESCRIPTION}
          </p>

          <p className="mt-5 text-[0.8rem] font-semibold tracking-[0.12em] text-muted uppercase">
            {DANCE_STYLES.join(" · ")}
          </p>

          <SubscribeButton className="mt-7" />
          <TodaySummary />
        </div>

        <CalendarEmbed />
      </div>
    </main>
  );
}
