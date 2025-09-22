import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder'

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
})

export const getStripeJs = async () => {
  const stripeJs = await import('@stripe/stripe-js')
  return stripeJs.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || 'pk_test_placeholder')
}
