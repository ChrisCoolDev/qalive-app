// supabase/functions/r2-upload/index.ts
// Génère une URL signée S3 (Presigned PUT URL) vers Cloudflare R2 après vérification :
// 1. Authentification JWT Supabase de l'organisateur
// 2. Propriété de la session (sessions.user_id === auth.user.id)
// 3. Quotas Option B :
//    - Plan Free : 1 fichier max par session, 5 Mo max (5 * 1024 * 1024 octets)
//    - Plan Pro  : fichiers illimités, 25 Mo max par fichier (25 * 1024 * 1024 octets)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID") || ""
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") || ""
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") || ""
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME") || "qalive-files"
const R2_PUBLIC_BASE_URL = (Deno.env.get("R2_PUBLIC_BASE_URL") || "https://files.qalive.online").replace(
  /\/+$/,
  ""
)

export const FREE_MAX_FILES_PER_SESSION = 1
export const FREE_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
export const PRO_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

const ALLOWED_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// --- Utilitaires AWS Signature V4 (Web Crypto natif, zéro dépendance lourde) ---
const encoder = new TextEncoder()

async function sha256Hex(data: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data))
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  return await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data))
}

async function hmacSha256Hex(key: ArrayBuffer | Uint8Array, data: string): Promise<string> {
  const sig = await hmacSha256(key, data)
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  )
}

export async function createR2PresignedPutUrl(params: {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  objectKey: string
  expiresInSeconds?: number
}): Promise<string> {
  const region = "auto"
  const service = "s3"
  const expiresIn = params.expiresInSeconds ?? 120

  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "") // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8) // YYYYMMDD

  const host = `${params.accountId}.r2.cloudflarestorage.com`
  const encodedKey = params.objectKey
    .split("/")
    .map((segment) => encodeRfc3986(segment))
    .join("/")
  const canonicalUri = `/${encodeRfc3986(params.bucket)}/${encodedKey}`

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const queryParams: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${params.accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host",
  }

  const canonicalQueryString = Object.keys(queryParams)
    .sort()
    .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(queryParams[k])}`)
    .join("&")

  const canonicalHeaders = `host:${host}\n`
  const signedHeaders = "host"
  const payloadHash = "UNSIGNED-PAYLOAD"

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n")

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n")

  const kDate = await hmacSha256(encoder.encode(`AWS4${params.secretAccessKey}`), dateStamp)
  const kRegion = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, service)
  const kSigning = await hmacSha256(kService, "aws4_request")
  const signature = await hmacSha256Hex(kSigning, stringToSign)

  return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`
}

function sanitizeFileName(rawName: string): string {
  return rawName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120)
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: ALLOWED_CORS_HEADERS })
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...ALLOWED_CORS_HEADERS, "Content-Type": "application/json" },
      })
    }

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return new Response(
        JSON.stringify({
          error: "Cloudflare R2 credentials are not configured yet on Supabase Edge Functions.",
        }),
        {
          status: 500,
          headers: { ...ALLOWED_CORS_HEADERS, "Content-Type": "application/json" },
        }
      )
    }

    const authHeader = req.headers.get("Authorization") || ""
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim()
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Missing authorization token." }), {
        status: 401,
        headers: { ...ALLOWED_CORS_HEADERS, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Identifier l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired user session." }), {
        status: 401,
        headers: { ...ALLOWED_CORS_HEADERS, "Content-Type": "application/json" },
      })
    }

    const body = await req.json()
    const sessionId = Number(body.sessionId)
    const fileName = String(body.fileName || "").trim()
    const fileSize = Number(body.fileSize || 0)
    const fileType = String(body.fileType || "application/octet-stream").trim()

    if (!sessionId || !fileName || fileSize <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid file metadata (sessionId, fileName, fileSize required)." }),
        {
          status: 400,
          headers: { ...ALLOWED_CORS_HEADERS, "Content-Type": "application/json" },
        }
      )
    }

    // 2. Vérifier que la session appartient bien à cet utilisateur
    const { data: sessionRow, error: sessionErr } = await supabase
      .from("sessions")
      .select("id, user_id")
      .eq("id", sessionId)
      .single()

    if (sessionErr || !sessionRow || String(sessionRow.user_id) !== String(user.id)) {
      return new Response(
        JSON.stringify({ error: "You are not authorized to upload files to this session." }),
        {
          status: 403,
          headers: { ...ALLOWED_CORS_HEADERS, "Content-Type": "application/json" },
        }
      )
    }

    // 3. Vérifier le statut Free vs Pro de l'utilisateur
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, plan")
      .eq("id", user.id)
      .maybeSingle()

    const isPremium =
      Boolean(profile?.is_premium) ||
      ["pro", "premium", "premium_plus", "cancelled_pro"].includes(String(profile?.plan || ""))

    // 4. Appliquer les quotas de l'Option B :
    //    - Free : max 1 fichier par session, max 5 Mo
    //    - Pro  : fichiers illimités, max 25 Mo par fichier
    const maxAllowedBytes = isPremium ? PRO_MAX_FILE_SIZE_BYTES : FREE_MAX_FILE_SIZE_BYTES

    if (fileSize > maxAllowedBytes) {
      const limitLabel = isPremium ? "25 MB" : "5 MB (Free Plan — upgrade to Pro for up to 25 MB)"
      return new Response(
        JSON.stringify({
          error: `File is too large. Maximum allowed size is ${limitLabel}.`,
          code: "FILE_TOO_LARGE",
        }),
        {
          status: 400,
          headers: { ...ALLOWED_CORS_HEADERS, "Content-Type": "application/json" },
        }
      )
    }

    if (!isPremium) {
      const { count, error: countErr } = await supabase
        .from("session_files")
        .select("*", { count: "exact", head: true })
        .eq("session_id", sessionId)

      if (!countErr && typeof count === "number" && count >= FREE_MAX_FILES_PER_SESSION) {
        return new Response(
          JSON.stringify({
            error: "Free Plan is limited to 1 document per session. Upgrade to Pro for unlimited documents.",
            code: "FREE_FILE_LIMIT_REACHED",
          }),
          {
            status: 403,
            headers: { ...ALLOWED_CORS_HEADERS, "Content-Type": "application/json" },
          }
        )
      }
    }

    // 5. Générer la clé R2 et l'URL signée (valide 2 minutes)
    const safeName = sanitizeFileName(fileName)
    const objectKey = `sessions/${sessionId}/${Date.now()}_${safeName}`

    const uploadUrl = await createR2PresignedPutUrl({
      accountId: R2_ACCOUNT_ID,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      bucket: R2_BUCKET_NAME,
      objectKey,
      expiresInSeconds: 120,
    })

    const publicUrl = `${R2_PUBLIC_BASE_URL}/${objectKey}`

    return new Response(
      JSON.stringify({
        ok: true,
        uploadUrl,
        publicUrl,
        objectKey,
        fileType,
        isPremium,
      }),
      {
        status: 200,
        headers: { ...ALLOWED_CORS_HEADERS, "Content-Type": "application/json" },
      }
    )
  } catch (err) {
    console.error("r2-upload error:", err)
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), {
      status: 500,
      headers: { ...ALLOWED_CORS_HEADERS, "Content-Type": "application/json" },
    })
  }
})

