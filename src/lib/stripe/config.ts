export const CREDIT_PACKAGES = [
  { id: 'pack_50', credits: 50, priceNok: 9, stripePriceId: process.env.STRIPE_PRICE_50! },
  { id: 'pack_200', credits: 200, priceNok: 29, stripePriceId: process.env.STRIPE_PRICE_200! },
  { id: 'pack_500', credits: 500, priceNok: 59, stripePriceId: process.env.STRIPE_PRICE_500! },
] as const

export type CreditPackage = (typeof CREDIT_PACKAGES)[number]

export function getPackage(id: string) {
  return CREDIT_PACKAGES.find(p => p.id === id)
}
