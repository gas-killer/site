import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"

/**
 * Base set of MDX components for docs pages: Fumadocs' defaults merged with any
 * per-page overrides. The docs page renderer additionally injects `OpenAPIPage`,
 * which needs the current page to preload its spec.
 */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
  }
}
