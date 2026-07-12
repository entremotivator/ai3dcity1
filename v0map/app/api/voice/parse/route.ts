import { parseVoiceCommandIntent } from "@/lib/voice-command-suite"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const command = String(body?.command || body?.text || "")
    return Response.json({ ok: true, parsed: parseVoiceCommandIntent(command) })
  } catch (error: any) {
    return Response.json({ ok: false, error: error?.message || "Unable to parse voice command" }, { status: 400 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  return Response.json({ ok: true, parsed: parseVoiceCommandIntent(searchParams.get("q") || "") })
}
