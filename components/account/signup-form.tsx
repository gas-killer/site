"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"

const schema = z.object({
  email: z.email("Enter a valid email address"),
  name: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  useCase: z.string().max(1000).optional(),
  newsletter: z.boolean(),
})

type Values = z.infer<typeof schema>

const inputClass = "border-white/10 bg-black text-white placeholder:text-zinc-600 focus-visible:ring-white/20"
const labelClass = "text-zinc-400 text-xs uppercase tracking-widest"

export function SignupForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [existingEmail, setExistingEmail] = useState<string | null>(null)
  const { register, control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { newsletter: false },
  })

  async function onSubmit(values: Values) {
    setError(null)
    const email = values.email.trim().toLowerCase()
    const resp = await fetch("/api/auth/sign-up/email-only", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, email }),
    })
    if (!resp.ok) {
      const body = await resp.json().catch(() => null)
      setError(resp.status === 429 ? "Too many attempts. Wait a minute and try again." : body?.message ?? "Sign up failed. Try again.")
      return
    }
    const { created } = (await resp.json()) as { created: boolean }

    const sent = await authClient.signIn.magicLink({ email, callbackURL: "/dashboard", errorCallbackURL: "/login" })
    if (!created) {
      setExistingEmail(email)
      return
    }
    if (sent.error) setError("Your account was created, but the confirmation email failed to send. Resend it from the dashboard.")
    router.push("/dashboard")
    router.refresh()
  }

  if (existingEmail) {
    return (
      <Alert className="border-white/10 bg-zinc-950 text-zinc-200">
        <AlertDescription className="text-zinc-300">
          <strong className="text-white">{existingEmail}</strong> already has an account. We sent a sign-in link to that
          address.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card className="border-white/10 bg-zinc-950 text-zinc-200">
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="email" className={labelClass}>Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" className={inputClass} {...register("email")} />
            {formState.errors.email && <p className="text-sm text-rose-300">{formState.errors.email.message}</p>}
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className={labelClass}>Name <span className="normal-case tracking-normal text-zinc-600">(optional)</span></Label>
              <Input id="name" autoComplete="name" className={inputClass} {...register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className={labelClass}>Company <span className="normal-case tracking-normal text-zinc-600">(optional)</span></Label>
              <Input id="company" autoComplete="organization" className={inputClass} {...register("company")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="useCase" className={labelClass}>What are you building? <span className="normal-case tracking-normal text-zinc-600">(optional)</span></Label>
            <Textarea id="useCase" rows={3} className={inputClass} {...register("useCase")} />
          </div>
          <div className="flex items-start gap-3">
            <Controller
              control={control}
              name="newsletter"
              render={({ field }) => (
                <Checkbox
                  id="newsletter"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="mt-0.5 border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
              )}
            />
            <Label htmlFor="newsletter" className="text-sm font-normal leading-snug text-zinc-400">
              Send me Gas Killer updates. You can unsubscribe from any email.
            </Label>
          </div>
          {error && <p className="text-sm text-rose-300">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={formState.isSubmitting} className="bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500">
            {formState.isSubmitting ? <><Spinner className="mr-2 text-black" />Creating account...</> : "Create account"}
          </Button>
          <p className="text-sm text-zinc-500">
            Already signed up?{" "}
            <Link href="/login" className="text-zinc-300 underline underline-offset-4 hover:text-white">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </form>
  )
}
