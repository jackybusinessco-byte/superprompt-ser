import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if Supabase environment variables are configured
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { success: false, message: 'Server configuration error - Missing Supabase credentials' },
        { status: 500 }
      )
    }

    // Create Supabase client with service role key for auth operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the base URL for the redirect
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.VERCEL_URL || 
                   'http://localhost:3000'

    // Send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`
    })

    if (error) {
      console.error('Supabase password reset error:', error)
      
      // Handle specific error cases
      if (error.message.includes('User not found')) {
        return NextResponse.json(
          { success: false, message: 'No account found with this email address' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { success: false, message: 'Failed to send reset email. Please try again.' },
        { status: 500 }
      )
    }

    // Always return success to prevent email enumeration
    return NextResponse.json(
      { 
        success: true, 
        message: 'If an account with this email exists, a password reset link has been sent to your email address.' 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Forgot password API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
