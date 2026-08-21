import Image from "next/image"
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"

/**
 * Shared layout options for the docs section: the nav brand and the links that
 * point back into the main marketing site.
 *
 * `Analyzer` and `GitHub` are not listed here — they render from the sidebar
 * footer (`DocsSidebarFooter`) so the page tree stays at the top of the sidebar.
 */
export function baseOptions(): BaseLayoutProps {
  return {
    // The site is dark-only; pin dark in the root provider and hide the toggle.
    themeSwitch: { enabled: false },
    nav: {
      title: (
        <span className="flex items-center gap-2">
          <Image
            src="/brand/gk-wordmark-transparent.png"
            alt="Gas Killer"
            width={200}
            height={200}
            priority
            className="h-7 w-auto"
          />
          <span className="text-fd-muted-foreground">Docs</span>
        </span>
      ),
      // The brand returns to the marketing home page; the sidebar covers docs.
      url: "/",
    },
    links: [{ text: "Home", url: "/", external: false }],
  }
}
