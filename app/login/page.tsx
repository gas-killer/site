import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AccountShell } from "@/components/account/account-shell"
import { LoginForm } from "@/components/account/login-form"
import { auth } from "@/lib/auth"
import { safeNextPath } from "@/lib/safe-redirect"

export const metadata: Metadata = {
  title: "Sign In | Gas Killer",
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams
  const target = safeNextPath(next)
  if (await auth.api.getSession({ headers: await headers() })) redirect(target)

  return (
    <AccountShell title="Welcome back." intro="We'll email you a link to sign in. No password needed.">
      <LoginForm next={target} linkError={error} />
    </AccountShell>
  )
}
