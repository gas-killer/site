import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AccountShell } from "@/components/account/account-shell"
import { SignupForm } from "@/components/account/signup-form"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Sign Up | Gas Killer",
  description: "Create a Gas Killer account to use the gas analyzer and request an API key.",
}

export default async function SignupPage() {
  if (await auth.api.getSession({ headers: await headers() })) redirect("/dashboard")

  return (
    <AccountShell
      eyebrow="Sign Up"
      title="Create your account."
      intro="All we need is your email. Confirm it to request an API key, and use the gas analyzer to see how much Gas Killer would save you."
    >
      <SignupForm />
    </AccountShell>
  )
}
