import { getWpConfig, wpError, wpFetch } from "@/lib/wp-api"

export async function GET() {
  const { wpUrl } = getWpConfig()
  const res = await wpFetch("/wp-json/wp/v2/pages?per_page=100&status=publish")

  if (!res.ok) {
    return wpError("Failed to fetch WordPress pages", res.status)
  }

  const pages = await res.json()

  return Response.json({
    pages: (Array.isArray(pages) ? pages : []).map((page) => ({
      id: page.id,
      title: page.title?.rendered || `Page ${page.id}`,
      slug: page.slug,
      link: page.link,
      edit: `${wpUrl}/wp-admin/post.php?post=${page.id}&action=edit`,
    })),
  })
}
