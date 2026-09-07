import { interpretIntent } from "@/lib/openai-agent";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  prompt: z.string().trim().min(4).max(500),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, message: "Enter a complete P2P request." }, { status: 400 });
  }

  try {
    const result = await interpretIntent(parsed.data.prompt);
    if (!result.parsed) {
      return Response.json({
        ok: false,
        code: "AI_UNAVAILABLE",
        message: "OpenAI intent parsing is not configured. Use the route fields below.",
      }, { status: 503 });
    }
    return Response.json({ ok: true, ...result });
  } catch {
    return Response.json({
      ok: false,
      code: "AI_UNAVAILABLE",
      message: "The agent could not interpret that request. Use the route fields below.",
    }, { status: 502 });
  }
}

