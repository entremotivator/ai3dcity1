const DEFAULT_WP_URL = "https://entremotivator.com"

function cleanAppPassword(value: string) {
  // WordPress Application Passwords are often copied in 6 groups with spaces.
  // The Basic header works reliably when the generated key is sent without spaces.
  return value.replace(/\s+/g, "")
}

export function getWpConfig() {
  const wpUrl = (process.env.WP_URL || DEFAULT_WP_URL).replace(/\/$/, "")
  const user = process.env.WP_USER || "Entremotivator"
  const pass = process.env.WP_APP_PASSWORD || ""
  const rawBasic = process.env.WP_BASIC_AUTH || ""
  const basic = rawBasic.replace(/^Basic\s+/i, "").trim() || Buffer.from(`${user}:${cleanAppPassword(pass)}`).toString("base64")

  return {
    wpUrl,
    user,
    pass,
    basic,
    authorization: `Basic ${basic}`,
  }
}

export async function wpFetch(path: string, init: RequestInit = {}) {
  const { wpUrl, authorization } = getWpConfig()
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  return fetch(`${wpUrl}${normalizedPath}`, {
    ...init,
    headers: {
      Authorization: authorization,
      Accept: "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  })
}

export async function readWpResponse(res: Response) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

export function wpError(message: string, status = 500, details: Record<string, unknown> = {}) {
  return Response.json({ error: message, ...details }, { status })
}
