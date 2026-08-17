import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"
import { listPublicPropertySlugs } from "@/modules/property/actions"
import { listPublicRealtors } from "@/modules/realtor/actions"

const STATIC_ROUTES: {
  path: string
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>
  priority: number
}[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/imoveis", changeFrequency: "daily", priority: 0.9 },
  { path: "/comprar", changeFrequency: "daily", priority: 0.8 },
  { path: "/alugar", changeFrequency: "daily", priority: 0.8 },
  { path: "/sobre", changeFrequency: "monthly", priority: 0.6 },
  { path: "/corretores", changeFrequency: "weekly", priority: 0.6 },
  { path: "/anunciar", changeFrequency: "monthly", priority: 0.5 },
]

// /favoritos fica de fora de propósito: sem conta de usuário, o conteúdo
// vem do localStorage do navegador — pro Google é sempre uma página vazia,
// sem nada pra indexar.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, realtors] = await Promise.all([
    listPublicPropertySlugs(),
    listPublicRealtors(),
  ])

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteConfig.url}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const propertyEntries: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${siteConfig.url}/imoveis/${property.slug}`,
    lastModified: property.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  const realtorEntries: MetadataRoute.Sitemap = realtors.map((realtor) => ({
    url: `${siteConfig.url}/corretores/${realtor.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }))

  return [...staticEntries, ...propertyEntries, ...realtorEntries]
}
