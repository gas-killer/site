"use client"

import { createOpenAPIPage } from "fumadocs-openapi/ui"

/**
 * Client component that renders an operation's interactive reference (parameters,
 * schemas, and the request playground). The generated API MDX pages pull this in
 * as `OpenAPIPage`; the docs page renderer feeds it the preloaded spec.
 */
export const OpenAPIPage = createOpenAPIPage()
