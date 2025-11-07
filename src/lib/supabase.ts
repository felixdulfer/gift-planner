import { createClient } from '@supabase/supabase-js'

// Get Supabase configuration from environment variables
// You can find these values in your Supabase project dashboard:
// 1. Go to https://supabase.com/dashboard
// 2. Select your project
// 3. Go to Settings → API
// 4. Copy the "Project URL" (this is your VITE_SUPABASE_URL)
// 5. Copy the "Publishable key" (this is your VITE_SUPABASE_PUBLISHABLE_KEY)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

if (!supabaseUrl || !supabasePublishableKey) {
	console.warn(
		'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY',
	)
	console.warn(
		'You can find these values in your Supabase project dashboard: Settings → API',
	)
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
	},
})

