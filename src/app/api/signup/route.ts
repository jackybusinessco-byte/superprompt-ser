import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword } from '@/lib/password-utils'

// Create Supabase client with proper error handling
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseKey)
}

/**
 * Check if a user with the given email already exists in the database
 * @param {string} email - The email address to check
 * @returns {Promise<boolean>} - True if user exists, false otherwise
 */
async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()
    
    console.log('Checking if email exists:', email)
    
    const { data, error } = await supabase
      .from('Users')
      .select('email')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 is "not found" error, which means email doesn't exist
        console.log('Email does not exist:', email)
        return false
      } else {
        console.error('Error checking email existence:', error)
        throw error
      }
    }

    console.log('Email exists:', email)
    return !!data // Returns true if data exists
  } catch (error) {
    console.error('Error in checkEmailExists:', error)
    throw error
  }
}

/**
 * Hash an email address using a simple hash function
 * @param {string} email - The email address to hash
 * @returns {string} - The hashed email
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
 * @param {string} email - The user's email address
 * @param {string} password - The user's password (will be stored as-is, not hashed)
 * @returns {Promise<Object>} - Result object with success status and message
 */
async function signUpUser(email: string, password: string) {
  try {
    console.log('Starting signup process for:', email)
    
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
    console.log('Email hashed successfully')
    
    // Hash the password for storage
    const hashedPassword = await hashPassword(password)
    console.log('Password hashed successfully')
    
    // Create Supabase client for database operations
    const supabase = createSupabaseClient()
    
    // Create Supabase client for Auth operations (using service role key for admin functions)
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase service role key for admin operations')
      return {
        success: false,
        message: "Server configuration error - Missing Supabase service credentials",
        error: "MISSING_SERVICE_VARS"
      }
    }
    
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey)
    
    // First, create user in Supabase Auth
    console.log('Creating user in Supabase Auth:', email)
    const { data: authData, error: authError } = await supabaseAuth.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm email for testing
    })
    
    if (authError) {
      console.error('Error creating user in Supabase Auth:', authError)
      return {
        success: false,
        message: "Failed to create user account",
        error: authError.message
      }
    }
    
    console.log('User created in Supabase Auth successfully:', authData.user?.id)
    
    // Store user in database with hashed password
    const userData = {
      email: email,
      password: hashedPassword, // Store hashed password
      'Encrypted Email': hashedEmail,
      isPro: false // Default to non-pro user
    }
    
    console.log('Attempting to insert user data:', { email, hashedEmail, isPro: false })
    
    const { data, error } = await supabase
      .from('Users')
      .insert([userData])
      .select()

    if (error) {
      console.error('Error inserting user:', error)
      // If database insert fails, we should clean up the Auth user
      // For now, just return the error
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
    console.log('Signup API endpoint called')
    
    // Check if environment variables are set
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables')
      console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing')
      console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing')
      return NextResponse.json(
        { success: false, message: 'Server configuration error - Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    console.log('Received signup request for email:', email)

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const result = await signUpUser(email, password)
    
    if (result.success) {
      console.log('Signup successful for:', email)
      return NextResponse.json(result, { status: 201 })
    } else {
      console.log('Signup failed for:', email, 'Reason:', result.message)
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('Error in signup API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 