// src/components/StripeButton.jsx
import React, { useMemo } from 'react'
import { loadStripe } from '@stripe/stripe-js'

export default function StripeButton({ priceId, children, className = '' }) {
  const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  const stripePromise = useMemo(() => {
    if (!publishableKey) {
      console.error('Missing REACT_APP_STRIPE_PUBLISHABLE_KEY')
      return null
    }
    return loadStripe(publishableKey)
  }, [publishableKey])

  const handleClick = async () => {
    if (!stripePromise) return
    const stripe = await stripePromise
    const res = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const { sessionId } = await res.json()
    if (sessionId) {
      const { error } = await stripe.redirectToCheckout({ sessionId })
      if (error) console.error('Stripe redirect error:', error)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!stripePromise}
      className={`flex-1 ${className}`}
    >
      {children}
    </button>
  )
}
