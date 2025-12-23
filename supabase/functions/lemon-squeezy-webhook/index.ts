// supabase/functions/lemon-squeezy-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const WEBHOOK_SECRET = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const verifySignature = async (request: Request, body: string) => {
  const secret = WEBHOOK_SECRET;
  const hmac = crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const signature = request.headers.get("x-signature") || "";
  const key = await hmac;
  const signatureBytes = hexToUint8Array(signature);
  const bodyBytes = new TextEncoder().encode(body);
  return await crypto.subtle.verify("HMAC", key, signatureBytes, bodyBytes);
};

function hexToUint8Array(hexString: string) {
  return new Uint8Array(hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

    const rawBody = await req.text()
    const isValid = await verifySignature(req, rawBody)

    if (!isValid) return new Response('Invalid signature', { status: 401 })

    const payload = JSON.parse(rawBody)
    const eventName = payload.meta.event_name
    const customData = payload.meta.custom_data || {} // On sécurise si c'est vide
    const data = payload.data

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    console.log(`🔍 Événement: ${eventName}`)

    // --- LOGIQUE PRINCIPALE ---
    if (eventName === 'subscription_created' || eventName === 'subscription_payment_success') {
      let userId = customData.user_id
      const userEmail = data.attributes.user_email
      const customerId = data.attributes.customer_id
      const portalUrl = data.attributes.urls.customer_portal

      // 👇 LE SAUVETAGE (FALLBACK) 👇
      if (!userId && userEmail) {
        console.log(`⚠️ ID manquant dans custom_data. Recherche via Email: ${userEmail}...`)

        // On cherche l'utilisateur qui a cet email dans la table profiles
        const { data: userFound } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userEmail)
          .single()

        if (userFound) {
          userId = userFound.id
          console.log(`✅ Utilisateur retrouvé grâce à l'email: ${userId}`)
        } else {
          console.error(`❌ Impossible de trouver un utilisateur avec l'email ${userEmail}`)
        }
      }

      // Si on a enfin un ID (soit via custom_data, soit via email)
      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({
            is_premium: true,
            lemon_squeezy_customer_id: customerId.toString(),
            plan: 'pro',
            billing_portal_url: portalUrl
          })
          .eq('id', userId)

        if (error) console.error('Erreur SQL update:', error)
        else console.log(`🎉 SUCCÈS: Profil mis à jour pour ${userId}`)
      } else {
        console.error("❌ ÉCHEC TOTAL: Aucun User ID trouvé (ni dans custom_data, ni via email).")
      }
    }

    // Gestion de l'annulation (L'utilisateur arrête le renouvellement)
    // MAIS il garde ses droits jusqu'à la fin de la période
    if (eventName === 'subscription_cancelled') {
      const customerId = data.attributes.customer_id
      const endsAt = data.attributes.ends_at // Lemon envoie la date de fin

      console.log(`⚠️ Annulation demandée pour le client ${customerId}. Fin d'accès prévue le : ${endsAt}`)

      await supabase.from('profiles')
        .update({
          // On garde is_premium à TRUE !
          is_premium: true,
          // On met à jour le statut pour l'affichage (ex: "Annulé, valide jusqu'au...")
          plan: 'cancelled_pro',
          renews_at: endsAt // On stocke la date de fin réelle
        })
        .eq('lemon_squeezy_customer_id', customerId.toString())
    }

    // Gestion de l'expiration (C'est ICI qu'on coupe vraiment)
    if (eventName === 'subscription_expired') {
      const customerId = data.attributes.customer_id

      console.log(`⛔ Abonnement expiré pour le client ${customerId}. Coupure des accès.`)

      await supabase.from('profiles')
        .update({
          is_premium: false, // C'est fini
          plan: 'basic',
          billing_portal_url: null,
          renews_at: null
        })
        .eq('lemon_squeezy_customer_id', customerId.toString())
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})
