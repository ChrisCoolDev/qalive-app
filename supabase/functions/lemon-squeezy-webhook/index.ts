// supabase/functions/lemon-squeezy-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const WEBHOOK_SECRET = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Fonction pour vérifier que la requête vient bien de Lemon Squeezy (Sécurité)
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
  
  return await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    bodyBytes
  );
};

function hexToUint8Array(hexString: string) {
  return new Uint8Array(hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // 1. Vérification de la signature
    const rawBody = await req.text()
    const isValid = await verifySignature(req, rawBody)
    
    if (!isValid) {
      return new Response('Invalid signature', { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const eventName = payload.meta.event_name
    const customData = payload.meta.custom_data // C'est ici qu'on récupère l'user_id qu'on enverra depuis le frontend
    const data = payload.data

    // Connexion Admin à Supabase
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 2. Traitement des événements
    console.log(`Received event: ${eventName}`)

    // Cas A: Abonnement créé ou payé
    if (eventName === 'subscription_created' || eventName === 'subscription_payment_success') {
      const userId = customData.user_id
      const customerId = data.attributes.customer_id
      
      if (userId) {
        // Mettre à jour le profil en PREMIUM
        const { error } = await supabase
          .from('profiles')
          .update({ 
            is_premium: true, 
            lemon_squeezy_customer_id: customerId.toString(),
            plan: 'pro'
          })
          .eq('id', userId)
        
        if (error) console.error('Error updating profile:', error)
      }
    }

    // Cas B: Abonnement annulé ou expiré
    if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
      // On retrouve l'utilisateur via son ID client Lemon Squeezy
      const customerId = data.attributes.customer_id
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_premium: false, 
          plan: 'basic' 
        })
        .eq('lemon_squeezy_customer_id', customerId.toString())

      if (error) console.error('Error downgrading profile:', error)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})