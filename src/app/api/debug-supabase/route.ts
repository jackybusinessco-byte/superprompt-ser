import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('🔍 Debug: Testing Supabase connection...')
    
    const supabaseUrl = 'https://bjkzknxapkbsunrsmoic.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqa3prbnhhcGtic3VucnNtb2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MjczNzgsImV4cCI6MjA2ODEwMzM3OH0.9Y53pbeHUZZeTpDBz3-xePlq0V7-eKdfdpz3I8XCzZM'
    
    console.log('🔍 Debug: URL:', supabaseUrl)
    console.log('🔍 Debug: Key length:', supabaseKey.length)
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test connection
    console.log('🔍 Debug: Created client, testing query...')
    const { data, error } = await supabase
      .from('Users')
      .select('*')
      .limit(5)

    console.log('🔍 Debug: Query result:', { data, error })

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error,
        url: supabaseUrl,
        keyLength: supabaseKey.length
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Connection working!',
      users: data,
      count: data?.length || 0
    })

  } catch (error) {
    console.error('🔍 Debug: Catch error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    console.log('🔍 Debug: Attempting to save:', email)
    
    const supabaseUrl = 'https://bjkzknxapkbsunrsmoic.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqa3prbnhhcGtic3VucnNtb2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MjczNzgsImV4cCI6MjA2ODEwMzM3OH0.9Y53pbeHUZZeTpDBz3-xePlq0V7-eKdfdpz3I8XCzZM'
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('Users')
      .upsert({
        email: email,
        isPro: true
      }, {
        onConflict: 'email'
      })
      .select()

    console.log('🔍 Debug: Upsert result:', { data, error })

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User saved!',
      user: data
    })

  } catch (error) {
    console.error('🔍 Debug: Save error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Save failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
} 