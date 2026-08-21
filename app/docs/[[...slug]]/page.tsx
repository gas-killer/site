import { source } from "@/lib/source"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page"
import { notFound } from "next/navigation"
import { findNeighbour } from "fumadocs-core/page-tree"
import { createRelativeLink } from "fumadocs-ui/mdx"
import type { Metadata } from "next"
import { getMDXComponents } from "@/components/mdx"
import { openapi } from "@/lib/openapi"
import { OpenAPIPage } from "@/components/api-page"

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body

  // Previous/next come from the unmodified tree: the sidebar tree appends
  // secondary links, which `findNeighbour` would otherwise treat as pages.
  const neighbours = findNeighbour(source.getPageTree(), page.url)

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      footer={{ items: neighbours }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
            // Generated API pages render <OpenAPIPage>; hydrate it with the
            // bundled spec declared in the page's `_openapi.preload` frontmatter.
            OpenAPIPage: async (apiProps) => (
              <OpenAPIPage
                {...(await openapi.preloadOpenAPIPage(page))}
                {...apiProps}
              />
            ),
          })}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
  }
}
