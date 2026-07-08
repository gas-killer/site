import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"

/**
 * Shared layout options for the docs section: the nav brand and the links that
 * point back into the main marketing site.
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Gas Killer Docs",
      url: "/docs",
    },
    links: [
      { text: "Home", url: "/", external: false },
      { text: "Analyzer", url: "/analyzer", external: false },
      { text: "GitHub", url: "https://github.com/gas-killer", external: true },
    ],
  }
}
