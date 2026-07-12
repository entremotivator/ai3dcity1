import fs from "node:fs"

const envPath = new URL("../.env.local", import.meta.url)
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue
    const [key, ...parts] = trimmed.split("=")
    process.env[key] = parts.join("=")
  }
}

const wpUrl = (process.env.WP_URL || "https://entremotivator.com").replace(/\/$/, "")
const user = process.env.WP_USER || "Entremotivator"
const pass = (process.env.WP_APP_PASSWORD || "").replace(/\s+/g, "")
const basic = (process.env.WP_BASIC_AUTH || Buffer.from(`${user}:${pass}`).toString("base64")).replace(/^Basic\s+/i, "")

const res = await fetch(`${wpUrl}/wp-json/fapc/v1/ping`, {
  headers: {
    Authorization: `Basic ${basic}`,
    Accept: "application/json",
  },
})

const text = await res.text()
console.log(`HTTP ${res.status}`)
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2))
} catch {
  console.log(text)
}

if (!res.ok) process.exit(1)
