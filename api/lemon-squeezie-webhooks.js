import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { buffer } from 'micro' // utile pour lire corps brut

const prisma = new PrismaClient()

const LEMON_WEBHOOK_SECRET = import.meta.env.LEMON_WEBHOOK_SECRET

export const config = {
  api: {
    bodyParser: false, // Nécessaire pour lire body brut et valider signature
  },
}

/**
 * Valide la signature HMAC SHA256 fournie par Lemon Squeezy
 * @param {Buffer} rawBody - corps brut de la requête
 * @param {string} signature - valeur de l'entête x-signature
 * @returns {boolean} - true si signature valide
 */
function verifySignature(rawBody, signature) {
  const hash = crypto.createHmac('sha256', LEMON_WEBHOOK_SECRET).update(rawBody).digest('hex')

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const rawBody = await buffer(req)
  const signature = req.headers['x-signature'] || ''

  if (!verifySignature(rawBody, signature)) {
    return res.status(401).end('Invalid signature')
  }

  const event = JSON.parse(rawBody.toString())

  if (event.resource?.type === 'order') {
    const order = event.resource.data

    if (order.state === 'paid') {
      const userId = order.metadata.user_id // UUID attendu

      try {
        await prisma.profiles.update({
          where: { id: userId },
          data: {
            plan: 'premium',
            is_premium: true,
            subscription_ends_at: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          },
        })
        return res.status(200).json({ message: 'Subscription activated' })
      } catch (err) {
        console.error('Update profile error:', err)
        return res.status(500).json({ error: 'Failed to update profile' })
      }
    }
  }

  res.status(400).json({ message: 'Event ignored' })
}
