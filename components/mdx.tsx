import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"
import { AvsContracts } from "@/components/avs-contracts"

/**
 * Base set of MDX components for docs pages: Fumadocs' defaults merged with any
 * per-page overrides. The docs page renderer additionally injects `OpenAPIPage`,
 * which needs the current page to preload its spec.
 *
 * `AvsContracts` is registered here rather than imported per page so the
 * Configuration page stays plain MDX; it is an async server component, which the
 * docs renderer already supports (see `OpenAPIPage`).
 */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    AvsContracts,
    ...components,
  }
}
