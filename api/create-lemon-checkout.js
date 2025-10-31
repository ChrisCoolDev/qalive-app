export default async function handler(req, res) {
  const { userId, variantId } = req.body

  if (!userId || !variantId) return res.status(400).json({ error: 'Missing parameters' })

  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.LEMON_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        variant_id: variantId,
        metadata: { user_id: userId },
      }),
    })

    const data = await response.json()

    if (!response.ok) throw new Error(data.message || 'Error creating checkout')

    res.status(200).json({ checkoutUrl: data.checkout.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
