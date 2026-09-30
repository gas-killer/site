import "server-only"
import { betterAuth, type BetterAuthPlugin } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { APIError, createAuthEndpoint } from "better-auth/api"
import { setSessionCookie } from "better-auth/cookies"
import { nextCookies } from "better-auth/next-js"
import { magicLink } from "better-auth/plugins/magic-link"
import * as z from "zod"
import { db } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { sendSignInEmail } from "@/lib/email"
import { subscribeAfterResponse } from "@/lib/newsletter"

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined)

export const signUpBodySchema = z.object({
  email: z.email().max(254),
  name: optionalText(100),
  company: optionalText(100),
  useCase: optionalText(1000),
  newsletter: z.boolean().optional(),
})

/**
 * Passwordless signup that signs the user in before their email is confirmed, so they
 * land on the dashboard straight away. The magic link sent afterwards is what proves the
 * email: verifying it flips `emailVerified` and revokes any session created before then,
 * so signing up with someone else's address grants nothing that survives their sign-in.
 */
const emailOnlySignUp = () =>
  ({
    id: "email-only-sign-up",
    endpoints: {
      signUpEmailOnly: createAuthEndpoint(
        "/sign-up/email-only",
        { method: "POST", body: signUpBodySchema },
        async (ctx) => {
          const { email, name, company, useCase, newsletter } = ctx.body
          const normalized = email.toLowerCase()

          // An existing account gets no session here, and its newsletter choice is left alone: the
          // request proves nothing about who controls the address. The caller sends a magic link.
          const existing = await ctx.context.internalAdapter.findUserByEmail(normalized)
          if (existing) return ctx.json({ created: false })

          const user = await ctx.context.internalAdapter.createUser({
            email: normalized,
            emailVerified: false,
            name: name ?? "",
            company: company ?? null,
            useCase: useCase ?? null,
            newsletterOptIn: newsletter ?? false,
          }, { method: "email-only" })
          if (!user) throw new APIError("INTERNAL_SERVER_ERROR", { message: "Failed to create user" })

          const session = await ctx.context.internalAdapter.createSession(user.id)
          if (!session) throw new APIError("INTERNAL_SERVER_ERROR", { message: "Failed to create session" })

          await setSessionCookie(ctx, { session, user })
          return ctx.json({ created: true })
        },
      ),
    },
    rateLimit: [
      {
        pathMatcher: (path: string) => path === "/sign-up/email-only",
        window: 60,
        max: 5,
      },
    ],
  }) satisfies BetterAuthPlugin

export const auth = betterAuth({
  appName: "Gas Killer",
  database: drizzleAdapter(db, { provider: "pg", schema }),
  user: {
    additionalFields: {
      company: { type: "string", required: false, input: false },
      useCase: { type: "string", required: false, input: false },
      newsletterOptIn: { type: "boolean", required: false, defaultValue: false, input: false },
      newsletterSubscribedAt: { type: "date", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      update: {
        // Confirming the email is the point an opt-in becomes a real address worth subscribing.
        after: async (updated) => {
          if (updated.emailVerified && updated.newsletterOptIn && !updated.newsletterSubscribedAt) {
            subscribeAfterResponse(updated.id, updated.email)
          }
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  // Serverless instances don't share memory, so limits have to live in the database.
  rateLimit: { enabled: true, storage: "database" },
  plugins: [
    emailOnlySignUp(),
    magicLink({
      expiresIn: 60 * 15,
      storeToken: "hashed",
      disableSignUp: true,
      sendMagicLink: async ({ email, url }, ctx) => {
        // Unknown addresses get the same response but no email, so the form can't enumerate accounts.
        const found = await ctx?.context.internalAdapter.findUserByEmail(email.toLowerCase())
        if (!found) return
        await sendSignInEmail(email, url, !found.user.emailVerified)
      },
    }),
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session
