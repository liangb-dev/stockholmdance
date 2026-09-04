import { connection } from "next/server";
import { getTodaysPayload } from "@/lib/events";

export async function GET() {
  await connection();

  try {
    const payload = await getTodaysPayload();

    return Response.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Could not load today's events." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
