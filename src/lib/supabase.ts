import { createClient } from '@supabase/supabase-js'

const getSupabaseConfig = () => {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL
  const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!rawUrl || !rawKey || rawUrl.includes('your_supabase_url')) {
    return { url: '', key: '', isValid: false }
  }

  try {
    // Ensure we only use the protocol and host (e.g., https://xyz.supabase.co)
    const urlObj = new URL(rawUrl)
    return { 
      url: `${urlObj.protocol}//${urlObj.host}`, 
      key: rawKey, 
      isValid: true 
    }
  } catch (e) {
    // Fallback if URL constructor fails
    return { 
      url: rawUrl.replace(/\/$/, ''), 
      key: rawKey, 
      isValid: true 
    }
  }
}

const { url, key, isValid } = getSupabaseConfig()

if (!isValid) {
  console.error('❌ Supabase configuration is missing or invalid. Check your .env file.')
} else {
  console.log(`✅ Supabase initialized for: ${url.substring(0, 15)}...`)
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co', 
  key || 'placeholder'
)
