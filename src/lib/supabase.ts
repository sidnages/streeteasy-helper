import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const getSavedConfig = () => {
  // Only use localStorage, ignore environment variables for the UI fields
  const savedUrl = localStorage.getItem('STREETEASY_SUPABASE_URL') || ''
  const savedKey = localStorage.getItem('STREETEASY_SUPABASE_KEY') || ''
  
  // Sanitization: Remove trailing slashes and common path mistakes
  let url = savedUrl.trim().replace(/\/$/, '')
  try {
    if (url) {
      const u = new URL(url)
      url = `${u.protocol}//${u.host}`
    }
  } catch (e) {}

  return {
    url,
    key: savedKey.trim(),
    isValid: !!url && !!savedKey
  }
}

let config = getSavedConfig()

export let supabase: SupabaseClient = createClient(
  config.url || 'https://placeholder.supabase.co',
  config.key || 'placeholder'
)

export const updateSupabaseConfig = (url: string, key: string) => {
  let sanitizedUrl = url.trim().replace(/\/$/, '')
  try {
    if (sanitizedUrl) {
      const u = new URL(sanitizedUrl)
      sanitizedUrl = `${u.protocol}//${u.host}`
    }
  } catch (e) {}

  localStorage.setItem('STREETEASY_SUPABASE_URL', sanitizedUrl)
  localStorage.setItem('STREETEASY_SUPABASE_KEY', key.trim())
  
  // Only update client if URL is valid format
  if (sanitizedUrl.startsWith('http')) {
    supabase = createClient(sanitizedUrl, key.trim())
  }
  return supabase
}
