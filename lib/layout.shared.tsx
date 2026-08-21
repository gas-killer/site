import Image from "next/image"
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"

/**
 * Shared layout options for the docs section.
 *
 * `links` is empty on purpose: the brand returns to the marketing home page, and
 * the secondary destinations render at the end of the sidebar tree instead of
 * above it (see `lib/docs-tree.tsx`).
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
            alt=""
            width={200}
            height={200}
            priority
            className="h-7 w-auto"
          />
          <span className="font-medium">Gas Killer Docs</span>
        </span>
      ),
      // The brand returns to the marketing home page; the sidebar covers docs.
      url: "/",
    },
    links: [],
  }
}
