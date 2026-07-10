type CardVariant = 'landscape' | 'poster'

export function getCardImageUrl(url: string | null | undefined, variant: CardVariant): string | null {
  if (!url) return null
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  const transform = variant === 'landscape'
    ? 'c_pad,w_800,h_552,b_black,f_auto,q_auto'
    : 'c_pad,w_600,h_900,b_black,f_auto,q_auto'
  return url.replace('/upload/', `/upload/${transform}/`)
}
