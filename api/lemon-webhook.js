import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Supabase avec service role key
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const signature = req.headers['x-signature']
    const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret')
      return res.status(401).json({ error: 'Missing signature' })
    }

    // Vérifier la signature
    const rawBody = JSON.stringify(req.body)
    const hmac = crypto.createHmac('sha256', webhookSecret)
    const digest = hmac.update(rawBody).digest('hex')

    if (signature !== digest) {
      console.error('Invalid webhook signature')
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const event = req.body
    const eventName = event.meta?.event_name
    const data = event.data

    console.log('📥 Webhook received:', eventName)

    switch (eventName) {
      case 'subscription_created':
        await handleSubscriptionCreated(data)
        break

      case 'subscription_updated':
        await handleSubscriptionUpdated(data)
        break

      case 'subscription_cancelled':
      case 'subscription_expired':
        await handleSubscriptionEnded(data)
        break

      case 'subscription_resumed':
        await handleSubscriptionResumed(data)
        break

      case 'subscription_payment_success':
        await handlePaymentSuccess(data)
        break

      default:
        console.log('⚠️ Unhandled event:', eventName)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return res.status(500).json({
      error: 'Webhook processing failed',
      details: error.message,
    })
  }
}

async function handleSubscriptionCreated(data) {
  try {
    const { attributes, id } = data
    const customData = attributes.custom_data || {}
    const userId = customData.user_id

    if (!userId) {
      console.error('❌ No user_id in subscription data')
      return
    }

    console.log('✅ Creating subscription for user:', userId)

    // 1. Insérer dans subscriptions
    const { error: subError } = await supabase.from('subscriptions').insert({
      user_id: userId,
      lemon_squeezy_id: id.toString(),
      order_id: attributes.order_id?.toString(),
      product_id: attributes.product_id?.toString(),
      variant_id: attributes.variant_id?.toString(),
      status: attributes.status,
      card_brand: attributes.card_brand,
      card_last_four: attributes.card_last_four,
      renews_at: attributes.renews_at,
      ends_at: attributes.ends_at,
      trial_ends_at: attributes.trial_ends_at,
    })

    if (subError) {
      console.error('❌ Error creating subscription:', subError)
      throw subError
    }

    // 2. Mettre à jour le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        plan: 'premium',
        lemon_squeezy_customer_id: attributes.customer_id?.toString(),
      })
      .eq('id', userId)

    if (profileError) {
      console.error('❌ Error updating profile:', profileError)
      throw profileError
    }

    console.log('✅ Subscription created successfully')
  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error)
    throw error
  }
}

async function handleSubscriptionUpdated(data) {
  try {
    const { attributes, id } = data

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: attributes.status,
        card_brand: attributes.card_brand,
        card_last_four: attributes.card_last_four,
        renews_at: attributes.renews_at,
        ends_at: attributes.ends_at,
        trial_ends_at: attributes.trial_ends_at,
      })
      .eq('lemon_squeezy_id', id.toString())

    if (error) throw error

    // Si actif, s'assurer que le profil est premium
    if (attributes.status === 'active' || attributes.status === 'on_trial') {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('lemon_squeezy_id', id.toString())
        .single()

      if (sub) {
        await supabase
          .from('profiles')
          .update({ is_premium: true, plan: 'premium' })
          .eq('id', sub.user_id)
      }
    }

    console.log('✅ Subscription updated successfully')
  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error)
    throw error
  }
}

async function handleSubscriptionEnded(data) {
  try {
    const { attributes, id } = data

    // 1. Mettre à jour subscription
    const { error: subError, data: sub } = await supabase
      .from('subscriptions')
      .update({
        status: attributes.status,
        ends_at: attributes.ends_at,
      })
      .eq('lemon_squeezy_id', id.toString())
      .select('user_id')
      .single()

    if (subError) throw subError

    // 2. Downgrade utilisateur
    if (sub) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_premium: false,
          plan: 'free',
        })
        .eq('id', sub.user_id)

      if (profileError) throw profileError
    }

    console.log('✅ Subscription ended, user downgraded to free')
  } catch (error) {
    console.error('Error in handleSubscriptionEnded:', error)
    throw error
  }
}

async function handleSubscriptionResumed(data) {
  try {
    const { attributes, id } = data

    const { error: subError, data: sub } = await supabase
      .from('subscriptions')
      .update({
        status: attributes.status,
        renews_at: attributes.renews_at,
      })
      .eq('lemon_squeezy_id', id.toString())
      .select('user_id')
      .single()

    if (subError) throw subError

    if (sub) {
      await supabase
        .from('profiles')
        .update({
          is_premium: true,
          plan: 'premium',
        })
        .eq('id', sub.user_id)
    }

    console.log('✅ Subscription resumed')
  } catch (error) {
    console.error('Error in handleSubscriptionResumed:', error)
    throw error
  }
}

async function handlePaymentSuccess(data) {
  try {
    const { attributes, id } = data

    const { error } = await supabase
      .from('subscriptions')
      .update({
        renews_at: attributes.renews_at,
      })
      .eq('lemon_squeezy_id', id.toString())

    if (error) throw error

    console.log('✅ Payment successful')
  } catch (error) {
    console.error('Error in handlePaymentSuccess:', error)
    throw error
  }
}
