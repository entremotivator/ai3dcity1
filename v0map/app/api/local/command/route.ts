import { NextRequest, NextResponse } from "next/server"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

const ALLOWED_SCRIPTS = new Set([
  "wp:ping",
  "wp:health",
  "wp:features",
  "wp:suite",
  "wp:windows",
  "wp:diagnostics",
  "wp:content",
  "wp:api-map",
])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const script = String(body?.script || "wp:ping").trim()

    if (!ALLOWED_SCRIPTS.has(script)) {
      return NextResponse.json(
        {
          ok: false,
          blocked: true,
          error: `Blocked unsafe local command. Allowed scripts: ${Array.from(ALLOWED_SCRIPTS).join(", ")}`,
        },
        { status: 400 },
      )
    }

    const { stdout, stderr } = await execFileAsync("pnpm", ["run", script], {
      cwd: process.cwd(),
      timeout: 20000,
      maxBuffer: 1024 * 1024,
      env: { ...process.env, CI: "1" },
    })

    return NextResponse.json({ ok: true, script, stdout, stderr })
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Local command failed",
        stdout: error?.stdout || "",
        stderr: error?.stderr || "",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    description: "Whitelisted local command bridge for the 3D realtime voice agent.",
    allowedScripts: Array.from(ALLOWED_SCRIPTS),
  })
}
