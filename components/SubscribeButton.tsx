import { CALENDAR_SUBSCRIBE_URL } from "@/lib/site";

export function SubscribeButton() {
  return (
    <a className="btn mt-4 shadow-md" href={CALENDAR_SUBSCRIBE_URL}>
      Subscribe to the calendar
    </a>
  );
}
