import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check all relevant environment variables
    const envVars = {
      // Server-side variables
      SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
      
      // Client-side variables
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ? 'Set' : 'Missing',
      
      // Vercel-specific variables
      VERCEL_URL: process.env.VERCEL_URL ? 'Set' : 'Missing',
      
      // Other useful variables
      NODE_ENV: process.env.NODE_ENV || 'Not set',
      VERCEL_ENV: process.env.VERCEL_ENV || 'Not set'
    }

    // Test Supabase connection if variables are available
    let supabaseTest = null
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
        
        // Test a simple query
        const { data, error } = await supabase
          .from('Users')
          .select('count')
          .limit(1)
        
        supabaseTest = {
          success: !error,
          error: error?.message || null,
          data: data ? 'Connection successful' : 'No data returned'
        }
      } catch (error) {
        supabaseTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: null
        }
      }
    }

    return NextResponse.json({
      success: true,
      environment: envVars,
      supabaseTest,
      timestamp: new Date().toISOString(),
      deployment: 'Vercel'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 