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

    // Debug environment variables
    const envDebug = {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'Not set',
      VERCEL_URL: process.env.VERCEL_URL || 'Not set'
    }

    // Check if Supabase environment variables are configured
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        message: 'Missing Supabase environment variables',
        debug: envDebug
      }, { status: 500 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the base URL for the redirect
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.VERCEL_URL || 
                   'http://localhost:3000'

    // Test Supabase connection first
    const { data: testData, error: testError } = await supabase
      .from('Users')
      .select('email')
      .limit(1)

    if (testError) {
      return NextResponse.json({
        success: false,
        message: 'Supabase connection failed',
        error: testError.message,
        debug: envDebug
      }, { status: 500 })
    }

    // Try to send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`
    })

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Failed to send reset email',
        error: error.message,
        debug: envDebug,
        baseUrl: baseUrl
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
      debug: envDebug,
      baseUrl: baseUrl,
      data: data
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 