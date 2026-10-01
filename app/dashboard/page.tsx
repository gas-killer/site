import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AccountShell } from "@/components/account/account-shell"
import { ApiKeyPanel, ConfirmEmailBanner, SignOutButton } from "@/components/account/dashboard-panels"
import { UserAvatar } from "@/components/account/user-avatar"
import { auth } from "@/lib/auth"
import { getLatestApiKey } from "@/lib/api-keys"
import { ANALYZER_DISABLED } from "@/lib/analyzer-status"

export const metadata: Metadata = {
  title: "Dashboard | Gas Killer",
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ confirm?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } })
  if (!session) redirect("/login?next=/dashboard")

  const { user } = session
  const latestKey = await getLatestApiKey(user.id)
  const { confirm } = await searchParams

  // Not greeted by name: anyone can set it at signup before the owner confirms the email.
  return (
    <AccountShell eyebrow="Dashboard" title="Your account.">
      <div className="flex min-w-0 items-center gap-3 text-sm text-zinc-400">
        <UserAvatar seed={user.id} className="size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/20" />
        <span className="truncate">Signed in as <span className="text-zinc-200">&ldquo;{user.email}&rdquo;</span></span>
      </div>

      {!user.emailVerified && <ConfirmEmailBanner email={user.email} sendFailed={confirm === "failed"} />}

      <ApiKeyPanel
        emailVerified={user.emailVerified}
        latestKey={
          latestKey && {
            keyPrefix: latestKey.keyPrefix,
            createdAt: latestKey.createdAt.toISOString(),
            expiresAt: latestKey.expiresAt.toISOString(),
          }
        }
      />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Try It Out</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <TryItCard
            href="/docs/quickstart"
            title="Quickstart"
            description="Send your first task to the router with your API key."
            action="Read the guide"
          />
          <TryItCard
            href="/life"
            title="Turetzky's Game of Life"
            description="Run a generation that costs 16.6M gas on-chain for about 115k with Gas Killer."
            action="Run a generation"
          />
          <TryItCard
            href={ANALYZER_DISABLED ? undefined : "/analyzer"}
            title="Gas analyzer"
            description="Replay a past transaction to see how much gas Gas Killer would save."
            action={ANALYZER_DISABLED ? "Coming soon" : "Open the analyzer"}
          />
        </div>
      </section>

      <div className="flex justify-end border-t border-white/10 pt-6">
        <SignOutButton />
      </div>
    </AccountShell>
  )
}

function TryItCard({ href, title, description, action }: {
  href?: string
  title: string
  description: string
  action: string
}) {
  const body = (
    <>
      <h3 className="font-medium text-white">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-zinc-400">{description}</p>
      <span className={href ? "mt-4 text-sm text-white" : "mt-4 text-sm text-zinc-500"}>
        {action} {href && <span aria-hidden>→</span>}
      </span>
    </>
  )
  const box = "flex flex-col rounded-lg border border-white/10 bg-zinc-950 p-5"
  if (!href) return <div aria-disabled="true" className={`${box} opacity-60`}>{body}</div>
  return (
    <Link href={href} className={`${box} transition-colors hover:border-white/30 hover:bg-zinc-900`}>
      {body}
    </Link>
  )
}
