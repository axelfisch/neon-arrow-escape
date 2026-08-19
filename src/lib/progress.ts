import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type { Progress } from "@/game/types";
import { DEFAULT_PROGRESS } from "@/game/types";

const payloadSchema = z.object({
  version: z.number(),
  completed: z.array(z.number()),
  stars: z.record(z.string(), z.number()),
  bestMoves: z.record(z.string(), z.number()),
  bestTime: z.record(z.string(), z.number()),
  dailyKey: z.string().nullable(),
  dailyWon: z.boolean(),
  dailyStars: z.number(),
  endlessBest: z.number(),
  lang: z.enum(["fr", "en"]),
  sound: z.boolean(),
  inspect: z.boolean(),
});

export const fetchCloudProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ payload: Progress }>`
      select payload from player_progress where user_id = ${context.userId} limit 1
    `;
    return rows[0]?.payload ?? { ...DEFAULT_PROGRESS };
  });

export const pushCloudProgress = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: Progress) => payloadSchema.parse(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const json = JSON.stringify(data);
    await sql`
      insert into player_progress (user_id, payload, updated_at)
      values (${context.userId}, ${json}::jsonb, now())
      on conflict (user_id) do update
        set payload = excluded.payload,
            updated_at = now()
    `;
    return { ok: true as const };
  });
