import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Check if a user with the given email already exists in the database
 */
async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('Users')
      .select('email')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected when email doesn't exist
      console.error('Error checking email existence:', error)
      throw error
    }

    return !!data // Returns true if data exists, false if not found
  } catch (error) {
    console.error('Error in checkEmailExists:', error)
    throw error
  }
}

/**
 * Hash an email address using a simple hash function
 */
function hashEmail(email: string): string {
  let hash = 0
  if (email.length === 0) return hash.toString()
  
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return hash.toString()
}

/**
 * Sign up a new user with email and password
 */
async function signUpUser(email: string, password: string) {
  try {
    // First, check if user already exists
    const userExists = await checkEmailExists(email)
    
    if (userExists) {
      console.log("user already exists")
      return {
        success: false,
        message: "User already exists",
        error: "DUPLICATE_EMAIL"
      }
    }

    // Hash the email for storage
    const hashedEmail = hashEmail(email)
    
    // Store user in database
    const { data, error } = await supabase
      .from('Users')
      .insert([
        {
          email: email,
          'Hashed Password': password, // Store password as-is (not hashed as requested)
          'Encrypted Email': hashedEmail,
          isPro: false // Default to non-pro user
        }
      ])

    if (error) {
      console.error('Error inserting user:', error)
      return {
        success: false,
        message: "Failed to create user",
        error: error.message
      }
    }

    console.log('User created successfully:', data)
    return {
      success: true,
      message: "User created successfully",
      data: data
    }

  } catch (error) {
    console.error('Error in signUpUser:', error)
    return {
      success: false,
      message: "An error occurred during signup",
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const result = await signUpUser(email, password)
    
    if (result.success) {
      return NextResponse.json(result, { status: 201 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('Error in signup API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('Users')
      .select('*')

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, users: data })
  } catch (error) {
    console.error('Error in get users API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 