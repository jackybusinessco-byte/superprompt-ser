import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        message: 'Missing environment variables',
        supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
        supabaseKey: supabaseKey ? 'Set' : 'Missing'
      }, { status: 500 })
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test connection by counting users
    const { count, error } = await supabase
      .from('Users')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        error: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount: count,
      environment: {
        supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
        supabaseKey: supabaseKey ? 'Set' : 'Missing'
      }
    })
    
  } catch (error) {
    console.error('Test DB error:', error)
    return NextResponse.json({
      success: false,
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 