import "server-only"
import { Resend } from "resend"

const from = process.env.EMAIL_FROM ?? "Gas Killer <noreply@gaskiller.xyz>"
// A reachable reply address is a trust signal to spam filters, and noreply@ would bounce replies.
const replyTo = "contact@gaskiller.xyz"
// Always the production host: preview deployments sit behind Vercel SSO, which would block the image.
const logoUrl = "https://gaskiller.xyz/brand/gk-wordmark.jpg"

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
    replyTo,
    subject: heading,
    text: `${heading}\n\n${action}: ${url}\n\nThis link expires in 15 minutes.${newsletterNote} If you didn't request it, ignore this email.`,
    html: `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5">
<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
  <img src="${logoUrl}" width="48" height="48" alt="Gas Killer" style="display:block;border:0;border-radius:10px;margin:0 0 24px">
  <div style="background:#fff;border-radius:12px;padding:24px">
    <h1 style="font-size:20px;margin:0 0 16px">${heading}</h1>
    <p style="margin:0 0 24px;color:#444">Click the button below to ${action.toLowerCase()}. This link expires in 15 minutes.${newsletterNote}</p>
    <a href="${url}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:14px">${action}</a>
    <p style="margin:24px 0 0;color:#888;font-size:12px">If you didn't request this, you can ignore this email.</p>
  </div>
  <p style="margin:24px 0 0;color:#888;font-size:12px;text-align:center">Gas Killer · <a href="https://gaskiller.xyz" style="color:#888">gaskiller.xyz</a></p>
</div>
</body>
</html>`,
  })
  if (error) throw new Error(`Failed to send email: ${error.message}`)
}
