export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, email } = req.body

    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing userId or email' })
    }

    const storeId = process.env.VITE_LEMON_SQUEEZY_STORE_ID
    const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY

    if (!storeId || !variantId || !apiKey) {
      console.error('Missing Lemon Squeezy config:', { storeId, variantId, hasApiKey: !!apiKey })
      throw new Error('Missing Lemon Squeezy configuration')
    }

    console.log('Creating checkout for:', { userId, email })

    // Appel API Lemon Squeezy
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: email,
              custom: {
                user_id: userId,
              },
            },
            product_options: {
              redirect_url:
                'https://qalive-app-git-develop-chriscooldevs-projects.vercel.app/?success=true',
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId.toString(),
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId.toString(),
              },
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Lemon Squeezy API Error:', errorData)
      throw new Error(`API Error: ${errorData.errors?.[0]?.detail || 'Unknown error'}`)
    }

    const data = await response.json()
    const checkoutUrl = data.data.attributes.url

    console.log('Checkout created successfully:', checkoutUrl)

    return res.status(200).json({ checkoutUrl })
  } catch (error) {
    console.error('Checkout creation error:', error)
    return res.status(500).json({
      error: 'Failed to create checkout',
      details: error.message,
    })
  }
}
