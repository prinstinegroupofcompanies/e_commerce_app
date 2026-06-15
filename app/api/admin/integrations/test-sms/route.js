import { z } from "zod";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { sendSms, isSmsConfigured } from "@/lib/sms";

export const dynamic = "force-dynamic";

const schema = z.object({
  phone: z.string().min(8).max(50),
  message: z.string().min(1).max(320).optional(),
});

export async function POST(request) {
  const auth = await requireSessionRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

  const body =
    parsed.data.message ||
    `${process.env.NEXT_PUBLIC_APP_NAME || "Markay Hall"}: Test SMS — your notification integration is working.`;

  const result = await sendSms({ to: parsed.data.phone, body });

  return jsonSuccess({
    ...result,
    configured: isSmsConfigured(),
    hint: result.skipped
      ? "Add Twilio credentials to .env or check server logs for the message body."
      : undefined,
  });
}
