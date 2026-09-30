"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"

const LINK_ERRORS: Record<string, string> = {
  INVALID_TOKEN: "That sign-in link has expired or was already used. Request a new one.",
}

export function LoginForm({ next, linkError }: { next: string; linkError?: string }) {
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(
    linkError ? LINK_ERRORS[linkError] ?? "That sign-in link didn't work. Request a new one." : null,
  )

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const normalized = email.trim().toLowerCase()
    if (!normalized) return
    setPending(true)
    setError(null)
    const { error } = await authClient.signIn.magicLink({ email: normalized, callbackURL: next, errorCallbackURL: "/login" })
    setPending(false)
    if (error) {
      setError(error.status === 429 ? "Too many attempts. Wait a minute and try again." : "Couldn't send a sign-in link. Try again.")
      return
    }
    setSentTo(normalized)
  }

  if (sentTo) {
    return (
      <Alert className="border-white/10 bg-zinc-950 text-zinc-200">
        <AlertDescription className="text-zinc-300">
          If <strong className="text-white">{sentTo}</strong> has an account, a sign-in link is on its way. It expires in
          15 minutes.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={onSubmit}>
      <Card className="border-white/10 bg-zinc-950 text-zinc-200">
        <CardContent className="space-y-2 pt-6">
          <Label htmlFor="email" className="text-zinc-400 text-xs uppercase tracking-widest">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-white/10 bg-black text-white placeholder:text-zinc-600 focus-visible:ring-white/20"
          />
          {error && <p className="pt-2 text-sm text-rose-300">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={pending} className="bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500">
            {pending ? <><Spinner className="mr-2 text-black" />Sending...</> : "Email me a sign-in link"}
          </Button>
          <p className="text-sm text-zinc-500">
            New here?{" "}
            <Link href="/signup" className="text-zinc-300 underline underline-offset-4 hover:text-white">Get started</Link>
          </p>
        </CardFooter>
      </Card>
    </form>
  )
}
