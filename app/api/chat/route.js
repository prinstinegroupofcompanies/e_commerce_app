import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { generateAssistantReply } from "@/lib/chat/assistant";
import { resolveVisitor, VISITOR_COOKIE } from "@/lib/chat/visitor";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  visitorKey: z.string().optional(),
});

export async function POST(request) {
  try {
    const session = await auth();
    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid message", parsed.error.flatten().fieldErrors, 422);
    }

    const headerKey = request.headers.get("x-visitor-key");
    const cookieKey = request.cookies.get(VISITOR_COOKIE)?.value;
    const visitorKey = parsed.data.visitorKey || headerKey || cookieKey;
    if (!visitorKey) return jsonError("Missing visitor key", [], 400);

    const customerId =
      session?.user?.role === "customer" ? session.user.id : null;
    const customerName = session?.user?.name ?? null;
    const customerEmail = session?.user?.email ?? null;

    await resolveVisitor(visitorKey, customerId);

    let chatSession = parsed.data.sessionId
      ? await prisma.chatSession.findFirst({
          where: { id: parsed.data.sessionId, visitorKey },
          include: {
            messages: { orderBy: { createdAt: "asc" }, take: 30 },
          },
        })
      : null;

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: { visitorKey, customerId },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 30 } },
      });
    }

    const history = chatSession.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "user",
        content: parsed.data.message.trim(),
      },
    });

    const reply = await generateAssistantReply({
      message: parsed.data.message,
      visitorKey,
      customerId,
      customerName,
      customerEmail,
      history,
    });

    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "assistant",
        content: reply.content,
      },
    });

    return jsonSuccess({
      sessionId: chatSession.id,
      content: reply.content,
      recommendations: reply.recommendations,
      intent: reply.intent,
      source: reply.source,
    });
  } catch (e) {
    console.error("[chat]", e);
    return jsonError("Could not process message", [], 500);
  }
}
