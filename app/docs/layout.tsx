import { DocsLayout } from "fumadocs-ui/layouts/docs"
import type { ReactNode } from "react"
import { baseOptions } from "@/lib/layout.shared"
import { sidebarTree } from "@/lib/docs-tree"

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={sidebarTree()} {...baseOptions()}>
      {children}
    </DocsLayout>
  )
}
