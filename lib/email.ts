import "server-only"
import { Resend } from "resend"

const from = process.env.EMAIL_FROM ?? "Gas Killer <noreply@gaskiller.xyz>"

let resend: Resend | undefined

export async function sendSignInEmail(
  to: string,
  url: string,
  { isNewUser, subscribesOnConfirm }: { isNewUser: boolean; subscribesOnConfirm: boolean },
) {
  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production") {
    console.info(`[email] sign-in link for ${to}: ${url}`)
    return
  }

  const heading = isNewUser ? "Confirm your email" : "Sign in to Gas Killer"
  const action = isNewUser ? "Confirm email" : "Sign in"
  // The opt-in was ticked before the address was proven, so the owner should know confirming acts on it.
  const newsletterNote = subscribesOnConfirm ? " Confirming also subscribes you to Gas Killer updates." : ""
  // Constructed on first send because Resend throws without a key, which would break `next build`.
  resend ??= new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from,
    to,
    subject: heading,
    text: `${heading}\n\n${action}: ${url}\n\nThis link expires in 15 minutes.${newsletterNote} If you didn't request it, ignore this email.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
  <h1 style="font-size:20px;margin:0 0 16px">${heading}</h1>
  <p style="margin:0 0 24px;color:#444">Click the button below to ${action.toLowerCase()}. This link expires in 15 minutes.${newsletterNote}</p>
  <a href="${url}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:14px">${action}</a>
  <p style="margin:24px 0 0;color:#888;font-size:12px">If you didn't request this, you can ignore this email.</p>
</div>`,
  })
  if (error) throw new Error(`Failed to send email: ${error.message}`)
}
