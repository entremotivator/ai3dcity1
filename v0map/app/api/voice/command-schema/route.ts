import { VOICE_COMMAND_GROUPS } from "@/lib/voice-command-suite"

export async function GET() {
  return Response.json({
    ok: true,
    version: "25.0.0",
    source: "next-local",
    modes: ["command", "dictation"],
    groups: VOICE_COMMAND_GROUPS,
    notes: [
      "Browser speech recognition runs client-side inside the 3D app.",
      "WordPress Application Password credentials stay server-side in Next API routes.",
      "Local command execution is allow-listed to WordPress diagnostic npm scripts only.",
    ],
  })
}
