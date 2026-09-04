import { CALENDAR_SUBSCRIBE_URL } from "@/lib/site";

export function SubscribeButton({ className = "mt-4" }: { className?: string }) {
  return (
    <a className={`btn ${className}`.trim()} href={CALENDAR_SUBSCRIBE_URL}>
      Subscribe to the calendar
    </a>
  );
}
