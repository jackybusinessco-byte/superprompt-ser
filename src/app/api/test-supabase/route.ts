import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test the connection by fetching all users
    const { data: users, error } = await supabase
      .from('Users')
      .select('*')
      .limit(10)

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection working!',
      users: users,
      count: users?.length || 0
    })

  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to connect to Supabase' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 })
    }

    // Test saving a user
    const { data, error } = await supabase
      .from('Users')
      .upsert({
        email: email,
        isPro: true
      }, {
        onConflict: 'email'
      })
      .select()

    if (error) {
      console.error('Failed to save test user:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User saved successfully!',
      user: data
    })

  } catch (error) {
    console.error('Test save error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save user' 
    }, { status: 500 })
  }
} 