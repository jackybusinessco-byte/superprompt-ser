import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Type definitions for our database
export interface User {
  email: string
  firstName?: string
  lastName?: string
  fullName?: string
  isPro: boolean
} 