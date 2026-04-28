import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const getSavedConfig = () => {
  const savedUrl = localStorage.getItem('STREETEASY_SUPABASE_URL')
  const savedKey = localStorage.getItem('STREETEASY_SUPABASE_KEY')
  
  const rawUrl = savedUrl || import.meta.env.VITE_SUPABASE_URL || ''
  const key = savedKey || import.meta.env.VITE_SUPABASE_ANON_KEY || ''

  // Sanitization: Remove trailing slashes and common path mistakes
  let url = rawUrl.trim().replace(/\/$/, '')
  try {
    if (url) {
      const u = new URL(url)
      url = `${u.protocol}//${u.host}`
    }
  } catch (e) {
    // If URL parsing fails, stick with the trimmed version
  }

  return {
    url,
    key: key.trim(),
    isValid: !!url && !!key && !url.includes('your_supabase_url')
  }
}

let config = getSavedConfig()

export let supabase: SupabaseClient = createClient(
  config.url || 'https://placeholder.supabase.co',
  config.key || 'placeholder'
)

export const updateSupabaseConfig = (url: string, key: string) => {
  // Sanitize before saving
  let sanitizedUrl = url.trim().replace(/\/$/, '')
  try {
    if (sanitizedUrl) {
      const u = new URL(sanitizedUrl)
      sanitizedUrl = `${u.protocol}//${u.host}`
    }
  } catch (e) {}

  localStorage.setItem('STREETEASY_SUPABASE_URL', sanitizedUrl)
  localStorage.setItem('STREETEASY_SUPABASE_KEY', key.trim())
  
  supabase = createClient(sanitizedUrl, key.trim())
  return supabase
}
