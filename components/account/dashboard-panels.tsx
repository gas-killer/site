"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Check, Copy, RotateCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"

const primaryButton = "bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500"
const outlineButton = "border-white/20 bg-transparent text-white hover:bg-white/10"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export function ConfirmEmailBanner({ email, sendFailed = false }: { email: string; sendFailed?: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function resend() {
    setState("sending")
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: "/dashboard", errorCallbackURL: "/login" })
    setState(error ? "error" : "sent")
  }

  return (
    <Alert className="border-amber-500/30 bg-amber-950/40 text-amber-100">
      <AlertTitle className="text-amber-100">Confirm your email</AlertTitle>
      <AlertDescription className="space-y-4 text-amber-100/80">
        {sendFailed && state === "idle" ? (
          <p>
            We couldn't send a confirmation link to <strong className="text-amber-50">{email}</strong>. Resend it to
            unlock API keys.
          </p>
        ) : (
          <p>
            We sent a confirmation link to <strong className="text-amber-50">{email}</strong>. Click it to unlock API
            keys. The link expires in 15 minutes.
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={resend} disabled={state === "sending"} className={outlineButton}>
            {state === "sending" ? <><Spinner className="mr-2" />Sending...</> : "Resend confirmation"}
          </Button>
          {state === "sent" && <span className="text-sm">Sent. Check your inbox.</span>}
          {state === "error" && <span className="text-sm text-rose-300">Couldn't send. Try again in a minute.</span>}
        </div>
      </AlertDescription>
    </Alert>
  )
}

type KeySummary = { keyPrefix: string; createdAt: string; expiresAt: string }

export function ApiKeyPanel({ emailVerified, latestKey }: { emailVerified: boolean; latestKey: KeySummary | null }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issued, setIssued] = useState<(KeySummary & { key: string }) | null>(null)
  const [copied, setCopied] = useState(false)

  const active = latestKey && new Date(latestKey.expiresAt) > new Date() ? latestKey : null
  const expired = latestKey && !active ? latestKey : null

  async function submit(endpoint: "/api/keys" | "/api/keys/rotate", fallbackError: string) {
    setPending(true)
    setError(null)
    const resp = await fetch(endpoint, { method: "POST" })
    const body = await resp.json().catch(() => null)
    setPending(false)
    if (!resp.ok) {
      setError(body?.error ?? fallbackError)
      return
    }
    setIssued(body)
  }

  const requestKey = () => submit("/api/keys", "Could not issue an API key.")
  const rotateKey = () => submit("/api/keys/rotate", "Could not rotate your API key.")

  async function copy() {
    if (!issued) return
    await navigator.clipboard.writeText(issued.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function done() {
    setIssued(null)
    router.refresh()
  }

  return (
    <Card className="border-white/10 bg-zinc-950 text-zinc-200">
      <CardHeader>
        <CardTitle className="text-white">API key</CardTitle>
        <CardDescription className="text-zinc-400">
          Keys authenticate requests to the Gas Killer router and last 30 days. Request a new one when yours expires.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {issued ? (
          <div className="space-y-3">
            <Alert className="border-emerald-500/30 bg-emerald-950/40 text-emerald-100">
              <AlertTitle className="text-emerald-100">Copy your key now</AlertTitle>
              <AlertDescription className="text-emerald-100/80">
                This is the only time it will be shown. Store it somewhere safe. It expires on {formatDate(issued.expiresAt)}.
              </AlertDescription>
            </Alert>
            <div className="flex items-start gap-2">
              <code className="min-w-0 flex-1 break-all rounded-md border border-white/10 bg-black px-3 py-2 font-mono text-sm text-white">
                {issued.key}
              </code>
              <Button
                size="icon"
                onClick={copy}
                aria-label={copied ? "Copied" : "Copy key"}
                title={copied ? "Copied" : "Copy key"}
                className={`shrink-0 ${primaryButton}`}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
        ) : active ? (
          // On phones the key gets its own row: three columns squeeze it into the dates and bury the rotate button.
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm sm:grid-cols-3">
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <dt className="text-zinc-500">Key</dt>
              <dd className="flex min-w-0 items-center gap-1 font-mono text-white">
                <span className="truncate">{active.keyPrefix}…</span>
                <RotateKeyButton keyPrefix={active.keyPrefix} expiresAt={active.expiresAt} pending={pending} onConfirm={rotateKey} />
              </dd>
            </div>
            <div><dt className="text-zinc-500">Created</dt><dd className="whitespace-nowrap text-white">{formatDate(active.createdAt)}</dd></div>
            <div><dt className="text-zinc-500">Expires</dt><dd className="whitespace-nowrap text-white">{formatDate(active.expiresAt)}</dd></div>
          </dl>
        ) : expired ? (
          <p className="text-sm text-zinc-400">
            Your key <span className="font-mono text-zinc-200">{expired.keyPrefix}…</span> expired on {formatDate(expired.expiresAt)}.
          </p>
        ) : !emailVerified ? (
          <p className="text-sm text-zinc-400">Confirm your email to request an API key.</p>
        ) : (
          <p className="text-sm text-zinc-400">You don't have an API key yet.</p>
        )}
        {error && <p className="text-sm text-rose-300">{error}</p>}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-3">
        {issued ? (
          <Button onClick={done} variant="outline" className={outlineButton}>I've stored my key</Button>
        ) : (
          <>
            {!active && (
              <Button onClick={requestKey} disabled={!emailVerified || pending} className={primaryButton}>
                {pending ? <><Spinner className="mr-2 text-black" />Requesting...</> : expired ? "Request new key" : "Request API key"}
              </Button>
            )}
            <Button asChild variant="outline" className={outlineButton}>
              <Link href="/docs/quickstart">
                Read the quickstart <span aria-hidden>→</span>
              </Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

function RotateKeyButton({
  keyPrefix,
  expiresAt,
  pending,
  onConfirm,
}: {
  keyPrefix: string
  expiresAt: string
  pending: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={pending}
          aria-label="Rotate key"
          title="Rotate key"
          className="-my-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          {pending ? <Spinner className="size-4" /> : <RotateCw className="size-4" />}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100%-2rem)] border-white/10 bg-zinc-950 text-zinc-200">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Rotate your API key?</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            <span className="font-mono text-zinc-200">{keyPrefix}…</span> stops working immediately and you'll get a new
            key. This does not extend the expiration date: the new key still expires on {formatDate(expiresAt)}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={outlineButton}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={primaryButton}>Yes</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function SignOutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <Button size="sm" variant="outline" onClick={signOut} disabled={pending} className={outlineButton}>
      Sign out
    </Button>
  )
}
