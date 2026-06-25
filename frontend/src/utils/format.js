export const formatRupees = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

export const pollinationsImageUrl = (prompt, seed = '') => {
  const cleanPrompt = String(prompt || 'premium ecommerce product photo')
    .replace(/\s+/g, ' ')
    .trim()

  const params = new URLSearchParams({
    width: '900',
    height: '700',
    nologo: 'true',
    seed: String(seed || cleanPrompt),
  })

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?${params.toString()}`
}

export const productImageUrl = (product, storeName = '') =>
  product?.image_url ||
  pollinationsImageUrl(
    `${product?.name || 'Product'} ${product?.category || ''} for ${storeName || 'an online store'}, clean ecommerce product photography on a bright studio background`,
    product?.id || product?.name
  )

export const storeImageUrl = (store) =>
  pollinationsImageUrl(
    `${store?.name || 'Online store'} ${store?.category || ''}, attractive modern ecommerce storefront with premium products`,
    store?.id || store?.name
  )
