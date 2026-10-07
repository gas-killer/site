import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AccountShell } from "@/components/account/account-shell"
import { SignupForm } from "@/components/account/signup-form"
import { auth } from "@/lib/auth"
import { safeNextPath } from "@/lib/safe-redirect"

export const metadata: Metadata = {
  title: "Sign Up | Gas Killer",
  description: "Create a Gas Killer account to use the gas analyzer and request an API key.",
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const target = safeNextPath((await searchParams).next)
  if (await auth.api.getSession({ headers: await headers() })) redirect(target)

  return (
    <AccountShell
      title="Create your account."
      intro="All we need is your email. Confirm it to request an API key and start submitting tasks."
    >
      <SignupForm next={target} />
    </AccountShell>
  )
}
