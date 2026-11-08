// supabase/functions/send-emails/index.ts
// Edge Function d'envoi d'emails via Resend pour qalive (https://qalive.online / https://app.qalive.online)
// Conçue pour atterrir en Boîte Principale (Primary Inbox) :
// - Expéditeur humain : "Chris from qalive <support@qalive.online>"
// - Reply-To : "support@qalive.online"
// - Format Founder-to-User aéré (interlignes line-height: 1.7 + espacement entre paragraphes)
// - Drip Queue anti-spam : envoi par petits lots (15 mails max par exécution avec pause entre chaque envoi)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const CRON_SECRET = Deno.env.get("CRON_SECRET")

const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Chris from qalive <support@qalive.online>"
const REPLY_TO_EMAIL = Deno.env.get("RESEND_REPLY_TO_EMAIL") || "support@qalive.online"

const LANDING_URL = "https://qalive.online"
const APP_URL = "https://app.qalive.online"

const DEFAULT_BATCH_SIZE = 15 // Maximum 15 emails par exécution pour protéger la réputation Gmail
const DELAY_BETWEEN_EMAILS_MS = 450 // Pause entre chaque appel Resend

type EmailType =
  | "domain_migration"
  | "welcome"
  | "upcoming_reminder_30m"
  | "session_recap"
  | "first_session_feedback_1h"

interface TemplateContext {
  firstName: string
  sessionName?: string
  sessionSlug?: string
  questionCount?: number
}

function extractFirstName(rawName?: string | null, email?: string | null): string {
  if (rawName && rawName.trim().length > 0) {
    const first = rawName.trim().split(/\s+/)[0]
    return first.charAt(0).toUpperCase() + first.slice(1)
  }
  if (email && email.includes("@")) {
    const prefix = email.split("@")[0].replace(/[._-]+/g, " ").trim().split(/\s+/)[0]
    if (prefix) return prefix.charAt(0).toUpperCase() + prefix.slice(1)
  }
  return "there"
}

/**
 * Génère un HTML ultra-épuré (style message personnel envoyé depuis Gmail/Apple Mail)
 * avec des interlignes généreux (line-height: 1.75) et des paragraphes bien espacés.
 */
function wrapPersonalHtml(paragraphs: string[]): string {
  const bodyHtml = paragraphs
    .map((p) => `<p style="margin: 0 0 18px 0; line-height: 1.75;">${p}</p>`)
    .join("\n")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.75; color: #1b1b1b;">
  <div style="max-width: 580px;">
    ${bodyHtml}
  </div>
</body>
</html>`
}

export function buildEmailContent(
  type: EmailType,
  ctx: TemplateContext
): { subject: string; text: string; html: string } {
  const firstName = ctx.firstName || "there"
  const sessionName = ctx.sessionName || "your session"
  const sessionSlug = ctx.sessionSlug || ""
  const questionCount = typeof ctx.questionCount === "number" ? ctx.questionCount : 0

  switch (type) {
    case "domain_migration": {
      const subject = "Quick update: qalive has a new web address"
      const text = [
        `Hi ${firstName},`,
        `Quick heads-up from Chris at qalive — we recently moved our platform to a new web address:`,
        `Landing page: ${LANDING_URL}\nWorkspace & dashboard: ${APP_URL}`,
        `Your account, your existing Q&A sessions, and your audience questions are all safe and waiting for you. Simply update your bookmarks and sign in at ${APP_URL}.`,
        `If you have any trouble accessing your workspace, just reply to this email — I read every message.`,
        `Best,\nChris from qalive`,
      ].join("\n\n")

      const html = wrapPersonalHtml([
        `Hi ${firstName},`,
        `Quick heads-up from Chris at <strong>qalive</strong> — we recently moved our platform to a new web address:`,
        `• Website: <a href="${LANDING_URL}" style="color: #1b1b1b; text-decoration: underline;">${LANDING_URL}</a><br/>• Your workspace: <a href="${APP_URL}" style="color: #1b1b1b; text-decoration: underline;">${APP_URL}</a>`,
        `Your account, your existing Q&amp;A sessions, and your audience questions are all safe and waiting for you. Simply update your bookmarks and sign in at <a href="${APP_URL}" style="color: #1b1b1b; text-decoration: underline;">app.qalive.online</a>.`,
        `If you have any trouble accessing your workspace, just reply to this email — I read every message.`,
        `Best,<br/>Chris from qalive`,
      ])

      return { subject, text, html }
    }

    case "first_session_feedback_1h": {
      const subject = `How did your first qalive session ("${sessionName}") go?`
      const text = [
        `Hi ${firstName},`,
        `Your first Q&A session "${sessionName}" on qalive wrapped up a little while ago.`,
        `I'd love to hear your honest thoughts: how did it go with your audience? Was there anything missing or frustrating that I should improve before your next session?`,
        `Just hit reply and let me know — even a one-line answer helps a lot.`,
        `Best,\nChris from qalive`,
      ].join("\n\n")

      const html = wrapPersonalHtml([
        `Hi ${firstName},`,
        `Your first Q&amp;A session "${sessionName}" on <strong>qalive</strong> wrapped up a little while ago.`,
        `I'd love to hear your honest thoughts: how did it go with your audience? Was there anything missing or frustrating that I should improve before your next session?`,
        `Just hit reply and let me know — even a one-line answer helps a lot.`,
        `Best,<br/>Chris from qalive`,
      ])

      return { subject, text, html }
    }

    case "welcome": {
      const subject = "Welcome to qalive"
      const text = [
        `Hi ${firstName},`,
        `Welcome to qalive! I'm Chris, the founder.`,
        `You can create your first live Q&A session in a few seconds from your workspace and share the QR code with your audience:\n${APP_URL}/overview`,
        `If you have any questions or feedback while setting up your session, just reply to this email — it goes straight to my inbox.`,
        `Best,\nChris from qalive`,
      ].join("\n\n")

      const html = wrapPersonalHtml([
        `Hi ${firstName},`,
        `Welcome to <strong>qalive</strong>! I'm Chris, the founder.`,
        `You can create your first live Q&amp;A session in a few seconds from your workspace and share the QR code with your audience:<br/><a href="${APP_URL}/overview" style="color: #1b1b1b; text-decoration: underline;">${APP_URL}/overview</a>`,
        `If you have any questions or feedback while setting up your session, just reply to this email — it goes straight to my inbox.`,
        `Best,<br/>Chris from qalive`,
      ])

      return { subject, text, html }
    }

    case "upcoming_reminder_30m": {
      const qrUrl = sessionSlug ? `${APP_URL}/session/${sessionSlug}/qrcode` : `${APP_URL}/overview`
      const subject = `Reminder: "${sessionName}" starts in 30 minutes`
      const text = [
        `Hi ${firstName},`,
        `Just a quick reminder that your qalive session "${sessionName}" is scheduled to start in about 30 minutes.`,
        `Here is your direct link to display the QR code for your audience:\n${qrUrl}`,
        `Have a great session!\nChris from qalive`,
      ].join("\n\n")

      const html = wrapPersonalHtml([
        `Hi ${firstName},`,
        `Just a quick reminder that your <strong>qalive</strong> session "${sessionName}" is scheduled to start in about 30 minutes.`,
        `Here is your direct link to display the QR code for your audience:<br/><a href="${qrUrl}" style="color: #1b1b1b; text-decoration: underline;">${qrUrl}</a>`,
        `Have a great session!<br/>Chris from qalive`,
      ])

      return { subject, text, html }
    }

    case "session_recap": {
      const sessionUrl = sessionSlug ? `${APP_URL}/session/${sessionSlug}` : `${APP_URL}/overview`
      const subject = `Recap for your qalive session "${sessionName}"`
      const questionLine =
        questionCount === 1
          ? `Your audience submitted 1 question during the session.`
          : `Your audience submitted ${questionCount} questions during the session.`

      const text = [
        `Hi ${firstName},`,
        `Your qalive session "${sessionName}" has just ended. ${questionLine}`,
        `You can review all the questions anytime in your workspace:\n${sessionUrl}`,
        `Best,\nChris from qalive`,
      ].join("\n\n")

      const html = wrapPersonalHtml([
        `Hi ${firstName},`,
        `Your <strong>qalive</strong> session "${sessionName}" has just ended. ${questionLine}`,
        `You can review all the questions anytime in your workspace:<br/><a href="${sessionUrl}" style="color: #1b1b1b; text-decoration: underline;">${sessionUrl}</a>`,
        `Best,<br/>Chris from qalive`,
      ])

      return { subject, text, html }
    }
  }
}

async function sendViaResend(params: {
  to: string
  subject: string
  text: string
  html: string
}): Promise<{ id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    return { error: "Missing RESEND_API_KEY secret in Supabase Edge Function" }
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [params.to],
      reply_to: REPLY_TO_EMAIL,
      subject: params.subject,
      text: params.text,
      html: params.html,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { error: data?.message || data?.error || `Resend HTTP ${res.status}` }
  }
  return { id: data.id }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.replace(/^Bearer\s+/i, "").trim()
  const cronHeader = req.headers.get("x-cron-secret") || ""

  if (SUPABASE_SERVICE_ROLE_KEY && token === SUPABASE_SERVICE_ROLE_KEY) return true
  if (CRON_SECRET && (cronHeader === CRON_SECRET || token === CRON_SECRET)) return true
  return false
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!isAuthorized(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const body = await req.json().catch(() => ({}))
    const mode = body.mode || "process"

    // -------------------------------------------------------------------------
    // MODE 1 : TEST D'ENVOI UNITAIRE (ex: vers app.qalive@gmail.com)
    // -------------------------------------------------------------------------
    if (mode === "test") {
      const to = body.to || "app.qalive@gmail.com"
      const template: EmailType = body.template || "domain_migration"
      const firstName = extractFirstName(body.first_name || "Chris", to)

      const content = buildEmailContent(template, {
        firstName,
        sessionName: body.session_name || "Product Launch Q&A",
        sessionSlug: body.session_slug || "product-launch-qa",
        questionCount: typeof body.question_count === "number" ? body.question_count : 12,
      })

      const result = await sendViaResend({
        to,
        subject: content.subject,
        text: content.text,
        html: content.html,
      })

      if (result.error) {
        return new Response(JSON.stringify({ ok: false, error: result.error }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }

      return new Response(
        JSON.stringify({
          ok: true,
          mode: "test",
          to,
          template,
          resend_id: result.id,
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // -------------------------------------------------------------------------
    // MODE 2 : MISE EN FILE D'ATTENTE DES 248 USERS (Campagne Nouveau Domaine)
    // -------------------------------------------------------------------------
    if (mode === "enqueue_domain_migration") {
      const { data: queuedCount, error: rpcError } = await supabase.rpc(
        "enqueue_domain_migration_campaign"
      )
      if (rpcError) throw rpcError

      return new Response(
        JSON.stringify({
          ok: true,
          mode: "enqueue_domain_migration",
          queued_users: queuedCount,
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    // -------------------------------------------------------------------------
    // MODE 3 : ORCHESTRATION AUTOMATIQUE + DÉPILAGE PAR PETITS LOTS (DRIP QUEUE)
    // -------------------------------------------------------------------------
    const batchSize = Math.min(Math.max(Number(body.batch_size) || DEFAULT_BATCH_SIZE, 1), 25)

    // 1. Synchroniser les 4 scénarios automatiques (welcome, upcoming 30m, recap, feedback 1h)
    const { data: lifecycleStats, error: lifecycleError } = await supabase.rpc(
      "enqueue_automated_lifecycle_emails"
    )
    if (lifecycleError) {
      console.warn("Warning enqueue_automated_lifecycle_emails:", lifecycleError.message)
    }

    // 2. Récupérer le prochain lot d'emails en attente (max 15 par défaut)
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("email_logs")
      .select("*")
      .eq("status", "queued")
      .lte("scheduled_for", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(batchSize)

    if (fetchError) throw fetchError

    let sentCount = 0
    let failedCount = 0

    for (const row of pendingEmails || []) {
      const firstName = extractFirstName(row.recipient_name, row.recipient_email)
      const payload = row.payload || {}

      const content = buildEmailContent(row.email_type as EmailType, {
        firstName,
        sessionName: payload.session_name,
        sessionSlug: payload.session_slug,
        questionCount: payload.question_count,
      })

      const res = await sendViaResend({
        to: row.recipient_email,
        subject: content.subject,
        text: content.text,
        html: content.html,
      })

      if (res.error) {
        failedCount++
        await supabase
          .from("email_logs")
          .update({
            status: "failed",
            error_message: res.error,
          })
          .eq("id", row.id)
      } else {
        sentCount++
        await supabase
          .from("email_logs")
          .update({
            status: "sent",
            resend_id: res.id || null,
            sent_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("id", row.id)
      }

      // Pause anti-spam / rate-limit entre deux envois
      await sleep(DELAY_BETWEEN_EMAILS_MS)
    }

    return new Response(
      JSON.stringify({
        ok: true,
        mode: "process",
        lifecycle_enqueued: lifecycleStats || {},
        processed: (pendingEmails || []).length,
        sent: sentCount,
        failed: failedCount,
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("send-emails error:", err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

