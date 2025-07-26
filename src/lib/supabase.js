import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// For browser usage, we'll need to get these from environment variables or config
// In a real application, you'd want to use the anon key for client-side operations
const supabaseUrl = 'https://your-project-ref.supabase.co' // Replace with your actual Supabase URL
const supabaseKey = 'your-anon-key' // Replace with your actual anon key

export const supabase = createClient(supabaseUrl, supabaseKey)

// Note: For production, you should use environment variables or a secure configuration method
// This is just for demonstration purposes 