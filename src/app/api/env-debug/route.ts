import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Environment Debug Check')
    
    const hasSupabaseUrl = !!process.env.SUPABASE_URL
    const hasSupabaseKey = !!process.env.SUPABASE_ANON_KEY
    const supabaseUrlLength = process.env.SUPABASE_URL?.length || 0
    const supabaseKeyLength = process.env.SUPABASE_ANON_KEY?.length || 0
    
    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      hasSupabaseUrl,
      hasSupabaseKey,
      supabaseUrlLength,
      supabaseKeyLength,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
    })

  } catch (error) {
    console.error('🔍 Environment debug error:', error)
    return NextResponse.json({
      success: false,
      error: 'Environment debug failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
} 