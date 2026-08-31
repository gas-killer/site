import { Gauge, Github } from "lucide-react"
import type * as PageTree from "fumadocs-core/page-tree"
import { source } from "@/lib/source"

/**
 * Secondary destinations appended to the end of the sidebar, so they stack with
 * the page entries instead of sitting above them or being pinned to the panel.
 *
 * These are display-only. `findNeighbour` treats every `type: 'page'` node as a
 * navigable page, so the docs page passes its previous/next items from the
 * unmodified tree, otherwise the last page's "next" link would be GitHub.
 */
const secondaryLinks: PageTree.Item[] = [
  {
    type: "page",
    name: "Analyzer",
    url: "/analyzer",
    icon: <Gauge />,
  },
  {
    type: "page",
    name: "GitHub",
    url: "https://github.com/gas-killer",
    external: true,
    icon: <Github />,
  },
]

/** The page tree as rendered in the sidebar, secondary links last. */
export function sidebarTree(): PageTree.Root {
  const tree = source.getPageTree()

  return {
    ...tree,
    children: [...tree.children, ...secondaryLinks],
  }
}
