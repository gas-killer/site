import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AccountShell } from "@/components/account/account-shell"
import { ApiKeyPanel, ConfirmEmailBanner, SignOutButton } from "@/components/account/dashboard-panels"
import { UserAvatar } from "@/components/account/user-avatar"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { getLatestApiKey } from "@/lib/api-keys"
import { ANALYZER_DISABLED } from "@/lib/analyzer-status"

export const metadata: Metadata = {
  title: "Dashboard | Gas Killer",
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } })
  if (!session) redirect("/login?next=/dashboard")

  const { user } = session
  const latestKey = await getLatestApiKey(user.id)

  return (
    <AccountShell eyebrow="Dashboard" title={user.name ? `Hi, ${user.name}.` : "Your account."}>
      <div className="flex items-center justify-between gap-4 text-sm text-zinc-400">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar seed={user.id} className="size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/20" />
          <span className="truncate">Signed in as <span className="text-zinc-200">{user.email}</span></span>
        </div>
        <SignOutButton />
      </div>

      {!user.emailVerified && <ConfirmEmailBanner email={user.email} />}

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

      {!ANALYZER_DISABLED && (
        <Card className="border-white/10 bg-zinc-950 text-zinc-200">
          <CardHeader>
            <CardTitle className="text-white">Gas analyzer</CardTitle>
            <CardDescription className="text-zinc-400">
              Replay a historical transaction to see how much gas Gas Killer would save you.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="bg-white text-black hover:bg-zinc-200">
              <Link href="/analyzer">Open the analyzer</Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </AccountShell>
  )
}
